# Quick Start Guide

Get up and running with the Agentic Chat UI in under 5 minutes.

## Prerequisites

- Node.js 16+ (18+ recommended)
- npm 8+
- Two terminal windows

## Installation

### 1. Server Setup (Terminal 1)

```bash
cd server
npm install
npm run dev
```

You should see:
```
╔════════════════════════════════════════╗
║   🤖 Agentic Chat Server               ║
║   📡 Running on http://localhost:3001  ║
║   🔥 Ready to receive requests         ║
╚════════════════════════════════════════╝
```

### 2. Client Setup (Terminal 2)

```bash
cd client
npm install
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 3. Open Browser

Navigate to: **http://localhost:5173**

## Try It Out

Type these commands in the chat:

1. **"Find emails from John"** - Shows email widgets
2. **"What's on my calendar today?"** - Shows calendar events
3. **"Book a flight to London"** - Shows flight cards
4. **"Show me the weather"** - Shows custom VDOM widget
5. **"Create an expense report"** - Shows interactive form
6. **"Show my next meeting"** - Shows meeting card with agenda

## What Just Happened?

- **Backend**: Mock agent matches keywords and returns streaming responses + widgets
- **Frontend**: Chat UI displays streaming text with blinking cursor, then renders widgets
- **Widgets**: Click actions loop back to the agent with context

## Project Structure

```
agent/
├── server/           # Backend (Node.js + Express)
│   ├── src/
│   │   ├── mock/     # Mock agent & scenarios
│   │   ├── routes/   # API endpoints
│   │   └── utils/    # SSE streaming helpers
│   └── package.json
│
├── client/           # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/       # Chat UI
│   │   │   └── Widgets/    # Widget system
│   │   ├── hooks/          # useChatAgent
│   │   ├── lib/            # API client
│   │   └── types/          # TypeScript types
│   └── package.json
│
└── docs/             # Documentation
```

## Key Features

### 1. Streaming Responses

Text streams word-by-word with a blinking cursor, just like ChatGPT.

### 2. Rich Widgets

6 predefined widgets:
- EmailPreviewWidget
- CalendarEventWidget
- SearchResultsWidget
- FormWidget
- MeetingCardWidget
- FlightCardWidget

### 3. Custom VDOM Widgets

Agent can create widgets on-the-fly using JSON:

```json
{
  "type": "custom",
  "vdom": {
    "component": "Card",
    "props": { "title": "My Widget" },
    "children": [
      { "component": "Text", "children": ["Hello!"] },
      { "component": "Button", "props": { "action": "click_me" }, "children": ["Click"] }
    ]
  }
}
```

### 4. Action Feedback Loop

Clicking widget buttons sends actions back to the agent with full context.

## Architecture Overview

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│  Chat UI │────▶│  Server  │
└──────────┘     └──────────┘     └──────────┘
                      ▲                  │
                      │   SSE Stream     │
                      │   (text+widgets) │
                      └──────────────────┘
```

### Communication Flow

1. User sends message
2. Server streams response via SSE:
   - `text_delta` events (streaming text)
   - `widget` events (rich UI components)
   - `done` event (end of stream)
3. Client renders text + widgets
4. User clicks widget action
5. New message sent with `widgetAction` payload
6. Loop continues...

## Next Steps

### Add Your Own Widget

1. **Create component** in `client/src/components/Widgets/predefined/MyWidget.tsx`
2. **Register** in `client/src/components/Widgets/predefined/index.ts`
3. **Add mock data** in `server/src/mock/widgets.ts`
4. **Add scenario** in `server/src/mock/scenarios.ts`

See [WIDGET_GUIDE.md](./client/docs/WIDGET_GUIDE.md) for detailed instructions.

### Connect Real LLM

Replace the mock agent in `server/src/mock/agent.ts` with:
- OpenAI API
- Anthropic Claude API
- Local Llama model
- Any LLM provider

The protocol is provider-agnostic!

### Add Persistence

Currently, messages are stored in React state. To persist:

**Option 1: LocalStorage**
```typescript
// In useChatAgent hook
useEffect(() => {
  localStorage.setItem('messages', JSON.stringify(messages));
}, [messages]);
```

**Option 2: Backend Database**
- Add PostgreSQL/MongoDB
- Save conversations with user ID
- Load history on app startup

### Deploy to Production

**Backend:**
```bash
cd server
npm run build
node dist/index.js
```

**Frontend:**
```bash
cd client
npm run build
# Serve dist/ folder with nginx/caddy/vercel
```

See README.md for detailed deployment guide.

## Troubleshooting

### Server won't start

**Error**: `EADDRINUSE: address already in use :::3001`

**Fix**: Kill process on port 3001
```bash
lsof -ti:3001 | xargs kill -9
```

### Client won't start

**Error**: `EADDRINUSE: address already in use :::5173`

**Fix**: Kill process on port 5173
```bash
lsof -ti:5173 | xargs kill -9
```

### Widgets not rendering

1. Check browser console for errors
2. Verify widget type is registered
3. Check network tab for SSE connection
4. Ensure data shape matches widget interface

### SSE connection fails

1. Check CORS settings in `server/src/index.ts`
2. Verify proxy config in `client/vite.config.ts`
3. Check server logs for errors

### TypeScript errors

```bash
# Client
cd client
npm run type-check

# Server
cd server
npm run type-check
```

## Development Tips

### Hot Reload

Both client and server support hot reload:
- **Client**: Vite HMR (instant)
- **Server**: tsx watch mode (recompiles on save)

### Debug Mode

Add logging:

**Client:**
```typescript
// In chat-client.ts
console.log('SSE event:', event);
```

**Server:**
```typescript
// In mock/agent.ts
console.log('Processing request:', request);
```

### Test Error Handling

Type "trigger error" in chat to simulate server error.

### Inspect SSE Stream

Open browser DevTools → Network → find `/api/chat` → Response tab

## Resources

- 📚 [Full Documentation](./client/docs/.claude.md)
- 🎨 [Widget Guide](./client/docs/WIDGET_GUIDE.md)
- 📡 [API Protocol](./client/docs/API_PROTOCOL.md)
- 📖 [README](./README.md)

## Support

- **Issues**: Open GitHub issue
- **Questions**: Check documentation first
- **Contributions**: PRs welcome!

---

**Built with ❤️ using React, TypeScript, and Ant Design**

Happy coding! 🚀
