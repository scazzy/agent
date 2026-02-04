# API Protocol Specification

Complete specification for the client-server communication protocol in the Agentic Chat UI.

## Overview

The protocol uses Server-Sent Events (SSE) for streaming responses from the server to the client. This enables real-time text streaming and progressive widget delivery.

## Table of Contents

1. [Endpoints](#endpoints)
2. [Request Format](#request-format)
3. [Response Format](#response-format)
4. [Widget Schema](#widget-schema)
5. [VDOM Specification](#vdom-specification)
6. [Error Handling](#error-handling)
7. [Examples](#examples)

## Endpoints

### POST /api/chat

Main chat endpoint that processes messages and streams responses.

**Headers:**
```
Content-Type: application/json
Accept: text/event-stream
```

**Request Body:** See [Request Format](#request-format)

**Response:** SSE stream. See [Response Format](#response-format)

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-02-03T10:30:00Z"
}
```

## Request Format

### ChatRequest

```typescript
interface ChatRequest {
  messages: Message[];
  conversationId?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  widgetAction?: WidgetAction;
}

interface WidgetAction {
  widgetId: string;
  actionType: string;
  actionData: any;
}
```

### Example Request

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Find emails from John"
    }
  ],
  "conversationId": "conv-1234567890"
}
```

### Request with Widget Action

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Find emails from John"
    },
    {
      "role": "assistant",
      "content": "I found 3 emails from John"
    },
    {
      "role": "user",
      "content": "Performed action: reply",
      "widgetAction": {
        "widgetId": "email-widget-123",
        "actionType": "reply",
        "actionData": {
          "emailId": "email-456"
        }
      }
    }
  ],
  "conversationId": "conv-1234567890"
}
```

## Response Format

### Server-Sent Events

Responses are sent as Server-Sent Events with this format:

```
data: <JSON_EVENT>\n\n
```

### StreamEvent Types

```typescript
type StreamEvent =
  | TextDeltaEvent
  | WidgetEvent
  | DoneEvent
  | ErrorEvent;
```

### TextDeltaEvent

Streams text content chunk by chunk.

```typescript
interface TextDeltaEvent {
  type: 'text_delta';
  content: string;
}
```

**Example:**
```
data: {"type":"text_delta","content":"I found "}
data: {"type":"text_delta","content":"3 emails "}
data: {"type":"text_delta","content":"from John."}
```

### WidgetEvent

Sends a widget to be rendered.

```typescript
interface WidgetEvent {
  type: 'widget';
  widget: WidgetBlock;
}
```

**Example:**
```json
data: {
  "type": "widget",
  "widget": {
    "id": "email-1",
    "type": "email_preview",
    "data": {
      "subject": "Project Update",
      "sender": {
        "name": "John Smith",
        "email": "john@example.com"
      },
      "snippet": "Hi team, I wanted to...",
      "timestamp": "2024-02-03T10:30:00Z"
    },
    "actions": [
      {
        "id": "reply",
        "label": "Reply",
        "type": "button",
        "variant": "primary"
      }
    ]
  }
}
```

### DoneEvent

Signals the end of the stream.

```typescript
interface DoneEvent {
  type: 'done';
}
```

**Example:**
```
data: {"type":"done"}
```

### ErrorEvent

Sends an error to the client.

```typescript
interface ErrorEvent {
  type: 'error';
  error: {
    message: string;
    code: string;
  };
}
```

**Example:**
```json
data: {
  "type": "error",
  "error": {
    "message": "Failed to process request",
    "code": "AGENT_ERROR"
  }
}
```

## Widget Schema

### WidgetBlock

Base schema for all widgets.

```typescript
interface WidgetBlock {
  id: string;
  type: string;
  data: any;
  actions?: WidgetActionDef[];
  vdom?: VDOMNode;
}
```

**Field Descriptions:**

- `id` (required): Unique identifier for this widget instance. Used to track actions.
- `type` (required): Widget type identifier (e.g., "email_preview", "calendar_event")
- `data` (required): Widget-specific data. Shape depends on widget type.
- `actions` (optional): Array of user actions available for this widget.
- `vdom` (optional): VDOM tree for custom/dynamic widgets.

### WidgetActionDef

Defines a user action for a widget.

```typescript
interface WidgetActionDef {
  id: string;
  label: string;
  type: 'button' | 'link' | 'form';
  variant?: 'primary' | 'default' | 'danger' | 'text';
}
```

**Field Descriptions:**

- `id` (required): Unique identifier for this action. Sent back in widgetAction payload.
- `label` (required): Display text for the action button.
- `type` (required): UI representation of the action.
- `variant` (optional): Visual style of the action button.

### Widget Data Schemas

Each widget type has its own data schema. See [WIDGET_GUIDE.md](./WIDGET_GUIDE.md) for complete schemas.

**Example - EmailPreviewData:**
```typescript
interface EmailPreviewData {
  subject: string;
  sender: {
    name: string;
    email: string;
  };
  snippet: string;
  timestamp: string;  // ISO 8601 format
  unread?: boolean;
}
```

## VDOM Specification

For custom/dynamic widgets created at runtime.

### VDOMNode

```typescript
interface VDOMNode {
  component: string;
  props?: Record<string, any>;
  children?: Array<VDOMNode | string>;
}
```

**Field Descriptions:**

- `component` (required): Component name (e.g., "Button", "Card", "Text")
- `props` (optional): Props to pass to the component
- `children` (optional): Array of child nodes or text content

### Supported Components

- `Button` - Clickable button
- `Card` - Container with title and border
- `Text` - Text display (Typography.Text)
- `Title` - Heading (Typography.Title)
- `Paragraph` - Paragraph text
- `Flex` - Flexbox container
- `Divider` - Horizontal divider
- `Input` - Text input field
- `Select` - Dropdown selector
- `DatePicker` - Date picker

### VDOM Example

```json
{
  "component": "Card",
  "props": {
    "title": "Custom Widget",
    "bordered": true
  },
  "children": [
    {
      "component": "Text",
      "props": { "strong": true },
      "children": ["Hello, World!"]
    },
    {
      "component": "Button",
      "props": {
        "type": "primary",
        "action": "my_action"
      },
      "children": ["Click Me"]
    }
  ]
}
```

### Action Binding

To make VDOM components interactive, use the `action` prop:

```json
{
  "component": "Button",
  "props": {
    "action": "action_id"
  },
  "children": ["Click"]
}
```

When clicked, this triggers `onAction('action_id')`.

## Error Handling

### Error Codes

```typescript
enum ErrorCode {
  AGENT_ERROR = 'AGENT_ERROR',           // Agent processing failed
  NETWORK_ERROR = 'NETWORK_ERROR',       // Network connectivity issue
  WIDGET_ERROR = 'WIDGET_ERROR',         // Widget rendering failed
  VALIDATION_ERROR = 'VALIDATION_ERROR', // Invalid request data
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',       // Request timeout
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',       // Unclassified error
}
```

### Client Error Handling

Clients should handle errors gracefully:

1. **Network Errors**: Show retry option
2. **Widget Errors**: Use ErrorBoundary to show fallback UI
3. **Stream Errors**: Display partial response + error message
4. **Validation Errors**: Show user-friendly message

### HTTP Status Codes

- `200 OK` - Request successful (SSE connection established)
- `400 Bad Request` - Invalid request format
- `500 Internal Server Error` - Server error

## Examples

### Complete Flow Example

**1. Initial Request:**

```json
POST /api/chat

{
  "messages": [
    {
      "role": "user",
      "content": "Find my unread emails"
    }
  ]
}
```

**2. Streaming Response:**

```
data: {"type":"text_delta","content":"I "}

data: {"type":"text_delta","content":"found "}

data: {"type":"text_delta","content":"3 "}

data: {"type":"text_delta","content":"unread "}

data: {"type":"text_delta","content":"emails:"}

data: {"type":"widget","widget":{"id":"email-1","type":"email_preview","data":{...}}}

data: {"type":"widget","widget":{"id":"email-2","type":"email_preview","data":{...}}}

data: {"type":"widget","widget":{"id":"email-3","type":"email_preview","data":{...}}}

data: {"type":"done"}
```

**3. User Clicks Reply on First Email:**

```json
POST /api/chat

{
  "messages": [
    {
      "role": "user",
      "content": "Find my unread emails"
    },
    {
      "role": "assistant",
      "content": "I found 3 unread emails:"
    },
    {
      "role": "user",
      "content": "Performed action: reply",
      "widgetAction": {
        "widgetId": "email-1",
        "actionType": "reply",
        "actionData": {}
      }
    }
  ]
}
```

**4. Agent Response:**

```
data: {"type":"text_delta","content":"I've "}

data: {"type":"text_delta","content":"opened "}

data: {"type":"text_delta","content":"a "}

data: {"type":"text_delta","content":"reply "}

data: {"type":"text_delta","content":"window. "}

data: {"type":"text_delta","content":"What "}

data: {"type":"text_delta","content":"would "}

data: {"type":"text_delta","content":"you "}

data: {"type":"text_delta","content":"like "}

data: {"type":"text_delta","content":"to "}

data: {"type":"text_delta","content":"say?"}

data: {"type":"done"}
```

### Multiple Widgets Example

```
data: {"type":"text_delta","content":"Here's your schedule for today:"}

data: {"type":"widget","widget":{"id":"cal-1","type":"calendar_event","data":{...}}}

data: {"type":"text_delta","content":" You also have 2 pending tasks:"}

data: {"type":"widget","widget":{"id":"task-1","type":"task_list","data":{...}}}

data: {"type":"done"}
```

### Custom VDOM Widget Example

```json
{
  "type": "widget",
  "widget": {
    "id": "custom-weather-1",
    "type": "custom",
    "data": {},
    "vdom": {
      "component": "Card",
      "props": {
        "title": "Weather",
        "bordered": true
      },
      "children": [
        {
          "component": "Flex",
          "props": { "justify": "space-between", "align": "center" },
          "children": [
            {
              "component": "Text",
              "props": { "style": { "fontSize": "48px" } },
              "children": ["☀️"]
            },
            {
              "component": "Flex",
              "props": { "vertical": true, "align": "end" },
              "children": [
                {
                  "component": "Text",
                  "props": { "strong": true, "style": { "fontSize": "32px" } },
                  "children": ["72°F"]
                },
                {
                  "component": "Text",
                  "props": { "type": "secondary" },
                  "children": ["Sunny"]
                }
              ]
            }
          ]
        },
        {
          "component": "Divider"
        },
        {
          "component": "Button",
          "props": {
            "type": "primary",
            "block": true,
            "action": "refresh_weather"
          },
          "children": ["Refresh"]
        }
      ]
    }
  }
}
```

### Error Response Example

```
data: {"type":"text_delta","content":"Let me help you with that..."}

data: {"type":"error","error":{"message":"Failed to connect to email service","code":"AGENT_ERROR"}}
```

## Protocol Versioning

Current version: **1.0**

Future versions will be backwards compatible. Breaking changes will increment the major version.

Version negotiation (future):
```json
{
  "version": "2.0",
  "messages": [...]
}
```

## Performance Considerations

### Chunking Strategy

- Text deltas: 5-20 words per chunk
- Widgets: Sent immediately after related text
- Multiple widgets: Sent sequentially, not batched

### Timeouts

- Client should timeout if no data received for 30 seconds
- Server should close connection after 5 minutes of inactivity

### Reconnection

Clients should implement exponential backoff for reconnection:
1. First retry: 1 second
2. Second retry: 2 seconds
3. Third retry: 4 seconds
4. Max retry delay: 30 seconds

## Security Considerations

### Input Validation

Server must validate:
- Message content length (max 10KB)
- Array lengths (max 100 messages)
- Widget action payloads (schema validation)

### Output Sanitization

- All text content should be sanitized before rendering
- VDOM components are restricted to safe set
- No arbitrary code execution

### Rate Limiting

Recommended rate limits:
- 10 requests per minute per user
- 100 requests per hour per user

## Migration Guide

### From Version 0.x to 1.0

No breaking changes. Version 1.0 is the initial release.

### Future Migrations

Breaking changes will be documented here with migration paths.

---

**Questions or issues?** See [.claude.md](./.claude.md) for more context or check the GitHub issues.
