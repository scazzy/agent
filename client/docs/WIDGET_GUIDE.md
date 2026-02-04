# Widget Development Guide

Complete guide to creating, using, and publishing widgets in the Agentic Chat UI.

## Table of Contents

1. [Widget Basics](#widget-basics)
2. [Predefined Widgets](#predefined-widgets)
3. [Creating Custom Widgets](#creating-custom-widgets)
4. [VDOM Specification](#vdom-specification)
5. [Widget Actions](#widget-actions)
6. [Testing Widgets](#testing-widgets)
7. [Best Practices](#best-practices)

## Widget Basics

### What is a Widget?

A widget is an interactive UI component that the AI agent can return as part of its response. Widgets go beyond plain text to provide rich, actionable interfaces.

### Widget Structure

```typescript
interface WidgetBlock {
  id: string;                    // Unique instance ID
  type: string;                  // Widget type (maps to component)
  data: any;                     // Widget-specific data
  actions?: WidgetActionDef[];   // Optional user actions
  vdom?: VDOMNode;               // Optional VDOM for custom widgets
}
```

### Widget Component Interface

All widget components must implement this interface:

```typescript
interface WidgetProps {
  widget: WidgetBlock;
  onAction?: (actionId: string, actionData?: any) => void;
}

// Example:
const MyWidget: React.FC<WidgetProps> = ({ widget, onAction }) => {
  const data = widget.data as MyWidgetData;

  return (
    <Card>
      <Title>{data.title}</Title>
      <Button onClick={() => onAction?.('my_action')}>
        Do Something
      </Button>
    </Card>
  );
};
```

## Predefined Widgets

### 1. EmailPreviewWidget

Shows email preview with sender, subject, snippet.

**Type**: `email_preview`

**Data Interface**:
```typescript
interface EmailPreviewData {
  subject: string;
  sender: { name: string; email: string };
  snippet: string;
  timestamp: string;
  unread?: boolean;
}
```

**Actions**: `reply`, `archive`, `open`

**Example**:
```typescript
{
  id: 'email-1',
  type: 'email_preview',
  data: {
    subject: 'Q4 Project Update',
    sender: { name: 'John Smith', email: 'john@example.com' },
    snippet: 'Hi team, I wanted to follow up on...',
    timestamp: '2024-02-03T10:30:00Z',
    unread: true
  },
  actions: [
    { id: 'reply', label: 'Reply', type: 'button', variant: 'primary' },
    { id: 'archive', label: 'Archive', type: 'button' }
  ]
}
```

### 2. CalendarEventWidget

Displays meeting/event details with time, location, participants.

**Type**: `calendar_event`

**Data Interface**:
```typescript
interface CalendarEventData {
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  participants: Array<{
    name: string;
    email: string;
    status?: 'accepted' | 'declined' | 'tentative';
  }>;
  meetingLink?: string;
  description?: string;
}
```

**Actions**: `join`, `decline`, `details`

### 3. SearchResultsWidget

List of search results (emails, documents, meetings).

**Type**: `search_results`

**Data Interface**:
```typescript
interface SearchResultsData {
  query: string;
  results: Array<{
    id: string;
    title: string;
    snippet: string;
    type: 'email' | 'document' | 'meeting';
    timestamp?: string;
  }>;
  totalCount: number;
}
```

**Actions**: `view_all`, `refine`

### 4. FormWidget

Dynamic form with validation and submit action.

**Type**: `form`

**Data Interface**:
```typescript
interface FormWidgetData {
  title: string;
  description?: string;
  fields: Array<{
    id: string;
    label: string;
    type: 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea';
    required?: boolean;
    placeholder?: string;
    options?: Array<{ label: string; value: string }>;
    validation?: {
      pattern?: string;
      min?: number;
      max?: number;
      message?: string;
    };
  }>;
  submitLabel?: string;
}
```

**Actions**: `submit`, `cancel`

### 5. MeetingCardWidget

Rich meeting card with agenda and attendees.

**Type**: `meeting_card`

**Data Interface**:
```typescript
interface MeetingCardData {
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees: Array<{
    name: string;
    email: string;
    avatar?: string;
  }>;
  agenda?: string[];
  meetingLink?: string;
  organizer: { name: string; email: string };
}
```

**Actions**: `join`, `add_to_calendar`, `view_agenda`

### 6. FlightCardWidget

Flight information card with booking actions.

**Type**: `flight_card`

**Data Interface**:
```typescript
interface FlightCardData {
  flightNumber: string;
  airline: string;
  departure: {
    airport: string;
    city: string;
    time: string;
    terminal?: string;
    gate?: string;
  };
  arrival: {
    airport: string;
    city: string;
    time: string;
    terminal?: string;
    gate?: string;
  };
  duration: string;
  price?: { amount: number; currency: string };
  class?: 'economy' | 'business' | 'first';
  stops?: number;
}
```

**Actions**: `book`, `details`, `compare`

## Creating Custom Widgets

### Step 1: Create Widget Component

```typescript
// src/components/Widgets/predefined/TaskListWidget.tsx
import React from 'react';
import { Card, Checkbox, List, Button } from 'antd';
import { WidgetProps } from '../WidgetRegistry';

interface TaskListData {
  title: string;
  tasks: Array<{
    id: string;
    text: string;
    completed: boolean;
  }>;
}

export const TaskListWidget: React.FC<WidgetProps> = ({ widget, onAction }) => {
  const data = widget.data as TaskListData;

  const handleToggle = (taskId: string) => {
    onAction?.('toggle_task', { taskId });
  };

  return (
    <Card size="small" style={{ marginTop: 8 }}>
      <h4>{data.title}</h4>
      <List
        dataSource={data.tasks}
        renderItem={(task) => (
          <List.Item>
            <Checkbox
              checked={task.completed}
              onChange={() => handleToggle(task.id)}
            >
              {task.text}
            </Checkbox>
          </List.Item>
        )}
      />
      {widget.actions?.map((action) => (
        <Button
          key={action.id}
          onClick={() => onAction?.(action.id)}
        >
          {action.label}
        </Button>
      ))}
    </Card>
  );
};
```

### Step 2: Register Widget

```typescript
// src/components/Widgets/predefined/index.ts
import { TaskListWidget } from './TaskListWidget';

export function registerPredefinedWidgets() {
  // ... existing registrations
  WidgetRegistry.register('task_list', TaskListWidget);
}

export { TaskListWidget };
```

### Step 3: Add Type Definition

```typescript
// src/types/protocol.ts (and server/src/types/protocol.ts)
export interface TaskListData {
  title: string;
  tasks: Array<{
    id: string;
    text: string;
    completed: boolean;
  }>;
}
```

### Step 4: Create Mock Data Generator (Server)

```typescript
// server/src/mock/widgets.ts
export function createTaskListWidget(): WidgetBlock {
  return {
    id: `task-${Date.now()}`,
    type: 'task_list',
    data: {
      title: 'Today\'s Tasks',
      tasks: [
        { id: '1', text: 'Review PR #234', completed: false },
        { id: '2', text: 'Update documentation', completed: true },
        { id: '3', text: 'Team standup at 10am', completed: false },
      ]
    },
    actions: [
      { id: 'add_task', label: 'Add Task', type: 'button' }
    ]
  };
}
```

### Step 5: Add Scenario (Server)

```typescript
// server/src/mock/scenarios.ts
{
  keywords: ['show tasks', 'my tasks', 'todo'],
  response: {
    text: 'Here are your tasks for today:',
    widgets: [createTaskListWidget()]
  }
}
```

## VDOM Specification

For dynamic widgets created by the agent at runtime.

### Supported Components

- `Button` - Clickable button
- `Card` - Container card
- `Text` - Text display (Typography.Text)
- `Title` - Heading (Typography.Title)
- `Paragraph` - Paragraph text
- `Flex` - Flexbox layout
- `Divider` - Horizontal divider
- `Input` - Text input
- `Select` - Dropdown select
- `DatePicker` - Date picker

### VDOM Structure

```typescript
interface VDOMNode {
  component: string;                      // Component name
  props?: Record<string, any>;            // Component props
  children?: Array<VDOMNode | string>;    // Child nodes or text
}
```

### Example: Weather Widget

```json
{
  "component": "Card",
  "props": {
    "title": "Weather Forecast",
    "bordered": true
  },
  "children": [
    {
      "component": "Flex",
      "props": { "vertical": true, "gap": "middle" },
      "children": [
        {
          "component": "Flex",
          "props": { "justify": "space-between" },
          "children": [
            {
              "component": "Text",
              "props": { "style": { "fontSize": "48px" } },
              "children": ["🌤️"]
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
                  "children": ["Partly Cloudy"]
                }
              ]
            }
          ]
        },
        {
          "component": "Button",
          "props": {
            "type": "primary",
            "block": true,
            "action": "view_forecast"
          },
          "children": ["View 7-Day Forecast"]
        }
      ]
    }
  ]
}
```

### Action Handling in VDOM

Use the `action` prop on interactive components:

```json
{
  "component": "Button",
  "props": {
    "action": "my_action_id"
  },
  "children": ["Click Me"]
}
```

When clicked, triggers: `onAction('my_action_id')`

## Widget Actions

### Defining Actions

```typescript
interface WidgetActionDef {
  id: string;              // Unique action identifier
  label: string;           // Button text
  type: 'button' | 'link' | 'form';
  variant?: 'primary' | 'default' | 'danger' | 'text';
}
```

### Handling Actions

```typescript
const handleAction = (actionId: string, actionData?: any) => {
  switch (actionId) {
    case 'reply':
      // Handle reply action
      onAction?.('reply', { emailId: widget.id });
      break;
    case 'submit':
      // Handle form submission
      onAction?.('submit', formValues);
      break;
  }
};
```

### Action Flow

1. User clicks widget button
2. `onAction(actionId, actionData)` called
3. New user message sent with `widgetAction` payload
4. Agent receives action in message history
5. Agent responds with appropriate text/widgets

## Testing Widgets

### Manual Testing

1. Add widget to mock scenarios
2. Trigger scenario with chat message
3. Verify widget renders correctly
4. Test all action buttons
5. Check error states

### Unit Testing (TODO)

```typescript
import { render, fireEvent } from '@testing-library/react';
import { EmailPreviewWidget } from './EmailPreviewWidget';

describe('EmailPreviewWidget', () => {
  it('renders email data correctly', () => {
    const widget = {
      id: 'test-1',
      type: 'email_preview',
      data: {
        subject: 'Test Email',
        sender: { name: 'John', email: 'john@example.com' },
        snippet: 'Test snippet',
        timestamp: new Date().toISOString()
      }
    };

    const { getByText } = render(
      <EmailPreviewWidget widget={widget} />
    );

    expect(getByText('Test Email')).toBeInTheDocument();
  });

  it('calls onAction when reply clicked', () => {
    const onAction = jest.fn();
    // ... test implementation
  });
});
```

## Best Practices

### 1. Data Validation

Always validate widget data:

```typescript
const data = widget.data as MyWidgetData;

if (!data || !data.title) {
  return <Alert type="error" message="Invalid widget data" />;
}
```

### 2. Error Boundaries

Widgets are wrapped in ErrorBoundary. Don't catch errors that should bubble up.

### 3. Responsive Design

Make widgets mobile-friendly:

```typescript
<Card style={{ width: '100%', maxWidth: 500 }}>
  {/* content */}
</Card>
```

### 4. Accessibility

- Use semantic HTML
- Add ARIA labels
- Support keyboard navigation
- Ensure color contrast

### 5. Performance

- Memoize expensive computations
- Use React.memo for pure components
- Lazy load heavy dependencies

### 6. Consistent Styling

Follow Ant Design patterns:
- Use `size="small"` for compact layouts
- Consistent spacing with Flex `gap`
- Standard colors from Ant Design theme

### 7. Action Naming

Use clear, action-oriented names:
- ✅ `reply`, `archive`, `book`
- ❌ `email_reply`, `doArchive`, `btnBook`

### 8. Type Safety

Always define TypeScript interfaces for widget data.

### 9. Documentation

Document widget data shape and actions in code comments.

### 10. Testing

Test with edge cases:
- Empty data
- Missing optional fields
- Long text content
- Multiple actions

## Widget Checklist

Before publishing a widget:

- [ ] Component implements `WidgetProps` interface
- [ ] Data interface defined in `protocol.ts`
- [ ] Widget registered in registry
- [ ] Mock data generator created
- [ ] Scenario added to trigger widget
- [ ] Actions properly handled
- [ ] Error states handled
- [ ] Responsive design tested
- [ ] Accessibility verified
- [ ] Documentation written
- [ ] Manual testing complete

## Widget Ideas

Inspiration for new widgets:

- **CodeBlockWidget** - Syntax-highlighted code with copy button
- **ChartWidget** - Data visualization (bar, line, pie charts)
- **MapWidget** - Location map with markers
- **GalleryWidget** - Image gallery with lightbox
- **PollWidget** - Interactive poll with voting
- **TimelineWidget** - Event timeline
- **KanbanWidget** - Kanban board with drag-drop
- **AudioWidget** - Audio player with waveform
- **VideoWidget** - Video player with controls
- **TableWidget** - Sortable, filterable data table

## Resources

- [Ant Design Components](https://ant.design/components/overview/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [MDN: Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

---

**Questions?** Check the [API_PROTOCOL.md](./API_PROTOCOL.md) or [.claude.md](./.claude.md) for more details.
