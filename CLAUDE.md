# Agent Project - Architecture & Decisions

## Project Structure

```
server/src/
├── agent/          # Agent orchestrator (coordinates LLM, tools, prompts)
├── apis/           # API schema definitions (self-descriptive REST endpoint docs)
├── context/        # System prompts, conversation memory, user context
│   └── prompts/    # Modular prompt system (base/, domains/, capabilities/)
├── llm/            # LLM provider abstraction (Ollama, etc.)
├── providers/      # Data providers (Titan Mail, Titan Calendar APIs)
├── tools/          # Tool definitions + handlers (what LLM can invoke)
├── types/          # TypeScript type definitions
├── utils/          # Stream helper, utilities
└── widgets/        # Widget generation and validation

client/src/
├── components/     # React components (Chat, Widgets, Login)
├── contexts/       # React contexts (Auth)
├── hooks/          # Custom hooks (useChatAgent)
├── lib/            # Services (chat-client, auth-service)
└── types/          # Client-side type definitions
```

## Architecture Flow

```
User Input → Client (useChatAgent) → POST /api/chat → Agent.processRequest()
  → PromptRouter.assemble() (domain detection + prompt assembly)
  → ToolRegistry.getDefinitionsByDomain() (filter relevant tools)
  → LLM.streamChat() (system prompt + conversation + tools)
  → Parse JSON response (thinking, tool_calls, response, widgets)
  → ToolExecutor.executeMany() (parallel tool execution)
  → Stream response back (SSE: text_delta, widget, status, done)
```

## Key Patterns

### Provider Pattern
- Each external API gets a Provider class (e.g., `TitanMailProvider`, `TitanCalendarProvider`)
- Providers handle: session auth, API calls, response parsing, caching
- Session (`SessionInfo`: token + baseUrl) is set per request from client
- In-memory caching per provider instance (folders, calendar list) - reset on session change

### Tool Pattern
- `ToolModel` = definition + action type + usage hints + domain
- `ToolHandler` = async function `(args) => ToolResult`
- Tools can: call APIs, instruct client, chain other tools, or run internal logic
- Registration: `registerXTools(registry, provider)` factory pattern
- Domain filtering: only relevant tools are sent to LLM per query

### Prompt Pipeline
- **Base prompts** (always loaded): persona, guardrails, response-format
- **Domain prompts** (loaded per intent): email, calendar, general
- **Capability prompts** (loaded when needed): widgets/VDOM
- Intent detection: keyword-based (fast, no extra LLM call)
- Assembly order: persona → guardrails → domain instructions → tools → response-format → user context

### Email Query Intent Pattern
**Tool Selection:**
- **`fetch_messages`**: Latest inbox, unread emails (NO date filter)
  - "show my emails", "any unread messages"
  - Set `unreadOnly: true` for "unread emails"
- **`titan_search_emails`**: Date-based queries, search with criteria
  - "emails today" → `startDate/endDate = today's date (yyyy-mm-dd)`
  - "new emails today" → `startDate/endDate = today, unreadOnly: true`
  - "emails this week" → `startDate = Monday, endDate = today`
  - Any search by sender/subject/keywords

**Key Rules:**
1. Date mentions ("today", "yesterday", "this week") → use `titan_search_emails` with date filters
2. "new emails" = unread (set `unreadOnly: true`)
3. Never fabricate email addresses - if no @, it's a name (use `query` field)

### Widget System
- **Predefined widgets**: email_preview, calendar_event, form, meeting_card, search_results
- **Custom widgets**: VDOM structure (Ant Design components)
- Widgets come from: tool results AND/OR LLM-generated
- Summary requests suppress widget display (text-only response)

## API Conventions

### Session Authentication
All Titan API calls require:
- Header: `X-Session-Token: <session>`
- Calendar also sends: `X-Supports-ICal: yes`

### Base URLs (IMPORTANT!)
**Email APIs**: Use `baseUrl` from login response (varies per cluster)
- Example: `https://titan-backend.flock-staging.com/s/1/345857/`

**Other APIs (Calendar, etc.)**: Use FIXED base URL
- Staging: `https://titan-backend.flock-staging.com`
- Prod: `https://api.titan.email`

### URL Construction
Always normalize URLs to prevent double slashes:
```typescript
const base = this.baseUrl.replace(/\/+$/, '');
const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
const url = `${base}${path}`;
```

### Bitset Decoding
Calendar APIs use bitsets for boolean flags:
- `calendarListAttr`: bit 0 = hidden, bit 1 = selected
- `calendarAttr`: bit 0 = deleted, bit 1 = primary, bit 2 = iCal
- Email `state`: bit 0 = unread, bit 3 = has attachment

### Calendar Events API
`POST /kairos/events/v2/fetchAll` - Fetch events with date range
- Request: `{ calID, startTime (epoch ms), endTime (epoch ms), syncToken?, pageToken? }`
- Either tokens OR time range, not both
- endTime - startTime must be <= 365 days

`POST /kairos/events/v2/fetch` - Fetch single event
- Request: `{ calID, eventId }`

### Pagination
- Calendar events: token-based (`pageToken` / `syncToken`)
- Email messages: cursor-based (`cursor`)
- Email search: token-based (`pt`)

## Common Gotchas

1. **URL double slash**: If `baseUrl` ends with `/` and endpoint starts with `/`, you get `//`. Always strip trailing slashes.
2. **Fabricated emails**: LLM may invent email addresses (e.g., john@company.com). The search tool validates against known fabricated domains.
3. **Summary vs display**: When user says "summarize", suppress widgets and return text only. When they say "show", return widgets.
4. **Primary calendar**: If no calendarId specified, auto-resolve to primary calendar from the list.
5. **Empty JSON response**: LLM sometimes wraps JSON in markdown code blocks. Parser strips ```json...``` wrappers.
6. **Calendar event endpoints**: Event APIs use `/kairos/events/v2/*` paths (not `/events/v2/*`). Missing `/kairos` prefix causes 404.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-05 | Server-side in-memory caching per provider | Minimal memory (<5KB per user), resets on session change. Redis for production scale later. |
| 2026-02-05 | Keyword-based intent detection (not LLM) | Avoids extra LLM roundtrip latency. Fast and sufficient for domain routing. |
| 2026-02-05 | ToolModel extends ToolDefinition | Backwards compatible. Existing code keeps working while new features opt-in to richer model. |
| 2026-02-05 | Prompts split into base/domains/capabilities | Each file is focused and independently maintainable. LLM sees only relevant context. |
| 2026-02-05 | Domain-filtered tools | Reduces prompt token count. LLM doesn't get confused by irrelevant tools. |
