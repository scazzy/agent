/**
 * Email Domain Prompt
 * Loaded when the user's query is about emails/messages.
 * Contains tool usage guidance, search decision trees, and summary formatting.
 */

export const emailDomainPrompt = {
  domain: 'email' as const,

  keywords: [
    // Core email terms
    'email', 'emails', 'mail', 'mails', 'inbox', 'message', 'messages',
    'unread', 'sent', 'draft', 'drafts', 'spam', 'trash',
    'sender', 'from', 'to', 'subject', 'attachment',
    'reply', 'forward', 'archive',
    // Action terms that imply email search
    'received', 'submitted', 'confirmation', 'receipt', 'invoice',
    'document', 'proof', 'status', 'update', 'notification',
    'newsletter', 'subscription', 'order', 'shipping', 'tracking',
    'ticket', 'support', 'request', 'application', 'response',
  ],

  instructions: `## Email Tools Guide

### Use \`fetch_messages\` when:
- User wants latest/recent emails: "show my inbox", "my emails", "what's new"
- User asks for "unread emails", "new emails", "new messages" → set \`unreadOnly: true\`
- User asks for emails "today" WITHOUT search keywords → set \`filterDate\` to today's date
- **Examples:**
  - "show my emails" → fetch_messages
  - "any unread messages" → fetch_messages { unreadOnly: true }
  - "any new emails today?" → fetch_messages { unreadOnly: true, filterDate: "2026-02-05" }
  - "emails today" → fetch_messages { filterDate: "2026-02-05" }
  - "what's in my inbox" → fetch_messages

### Use \`titan_search_emails\` when:
- User is searching by sender NAME, subject, keywords, or content
- User wants to FIND/SEARCH specific emails
- **Examples:**
  - "find invoice emails" → titan_search_emails { query: "invoice" }
  - "find emails from James" → titan_search_emails { query: "james" }
  - "emails from support@acme.com" → titan_search_emails { from: ["support@acme.com"] }

## Tool Selection Decision Tree

**Step 1: Is user SEARCHING for specific content?**
- User says "find", "search", "look for", mentions a person/company name, or topic → Use \`titan_search_emails\`
- User just wants to see their inbox/recent/new/unread → Use \`fetch_messages\`

**Step 2: For \`fetch_messages\`, set filters:**
- "new" or "unread" → \`unreadOnly: true\`
- "today" → \`filterDate: "yyyy-mm-dd"\` (today's date)

**Step 3: For \`titan_search_emails\`, build CONCISE query:**

**CRITICAL: The \`query\` field does FULL-TEXT search. Only include KEY NOUNS/TOPICS that would appear in email content.**

✅ INCLUDE: Topic nouns, product names, company names, person names
❌ EXCLUDE: Verbs (submitted, sent, received), pronouns (I, my, user), filler words (the, a, by, from, about)

**Examples of query optimization:**
- User says: "What is the status of insurance proof I submitted?" → query: "insurance proof status"
- User says: "Did I receive the contract from Acme Corp?" → query: "contract Acme"
- User says: "Find emails about my flight booking" → query: "flight booking"
- User says: "Show me the invoice sent by James" → query: "invoice james"

## Examples

User: "any new emails today?"
→ fetch_messages { "unreadOnly": true, "filterDate": "2026-02-05" }

User: "show my inbox"
→ fetch_messages {}

User: "unread emails"
→ fetch_messages { "unreadOnly": true }

User: "find invoice sent by james"
→ titan_search_emails { "query": "invoice james" }

User: "what's the status of my insurance submission?"
→ titan_search_emails { "query": "insurance proof" }

User: "emails from support@acme.com"
→ titan_search_emails { "from": ["support@acme.com"] }

User: "did I get a response about the job application?"
→ titan_search_emails { "query": "job application" }

**KEY RULES:**
1. **Query = KEY NOUNS ONLY.** Strip verbs, pronouns, filler words. "insurance proof submitted by user" → "insurance proof"
2. **Never invent email addresses.** If no @ symbol, it's a name - put in query.
3. **unreadOnly defaults to null.** Only set true when user says "unread" or "new".

## Email Summary Format

When summarizing emails, write **concise natural language** - NOT just subject + snippet.

**BAD (too verbose):**
"Kavya Varma - Your confirmation code: Sign-in from unauthorized device detected — please verify."

**GOOD (natural, concise, actionable):**
"Kavya Varma sent a security alert - unauthorized device sign-in detected, verification needed."

**Summary structure:**
"Here's a summary of your [N] emails:

• **[Sender]** - [brief natural description of what it's about]
• **[Sender]** - [action needed or key info]
..."

Tips:
- Use natural language, not just subject lines
- Highlight actions needed (verify, respond, review)
- Keep each item to one short sentence
- Group similar items if many emails

## Zero Results
When search returns 0: "I couldn't find any emails matching '[criteria]'. Try broadening your search or checking a different folder."`,
};
