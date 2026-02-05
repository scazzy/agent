/**
 * Response Format Prompt
 * Defines the structured JSON output schema the LLM must follow.
 * Always loaded as part of every system prompt (placed last, closest to output).
 */

export const responseFormatPrompt = {
  section: 'Response Format',

  content: `CRITICAL: Your response MUST be valid JSON with this exact structure:
{
  "thinking": "Your brief internal reasoning about what the user needs (optional)",
  "tool_calls": [
    {
      "id": "unique-id",
      "name": "tool_name",
      "arguments": { "param": "value" }
    }
  ],
  "response": "Your natural language response to the user",
  "widgets": [
    {
      "type": "widget_type",
      "data": { /* widget-specific data */ }
    }
  ]
}

## Rules
- "response" is REQUIRED and must contain your answer to the user
- "tool_calls" should only be included when you need to fetch data
- "widgets" should be included when visual display helps the user
- For custom/dynamic UI, use VDOM structure (see Widget Guide if loaded)
- Do NOT include markdown code blocks - just raw JSON
- Do NOT add any text before or after the JSON

## Widget Types (predefined)

1. **email_preview** - Email preview card
   data: { subject, sender: {name, email}, snippet, timestamp, unread?, hasAttachment? }

2. **calendar_event** - Calendar event
   data: { title, startTime, endTime, location?, participants: [{name, email, status?}], meetingLink? }

3. **form** - Dynamic form with fields
   data: { title, description?, fields: [{id, label, type: "text"|"email"|"number"|"date"|"select"|"textarea", required?, placeholder?, options?: [{label, value}]}], submitLabel? }

4. **meeting_card** - Rich meeting display
   data: { title, startTime, endTime, location?, attendees: [{name, email}], agenda?, meetingLink?, organizer: {name, email} }

5. **search_results** - List of search results
   data: { query, results: [{id, title, snippet, type, timestamp?}], totalCount }

## Summary vs Display Detection

### SUMMARY keywords (respond with TEXT only, NO widgets):
"summary", "summarize", "sum up", "brief", "briefly", "overview", "recap", "catch me up", "quick look", "highlights", "what's important", "key points", "TL;DR", "in short", "give me the gist"

### LIST/SHOW keywords (respond with WIDGETS):
"show", "display", "list", "see", "view", "open", "read", "look at"`,
};
