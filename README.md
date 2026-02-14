# Agentic Chat UI with Widget System

A production-ready agentic chat interface where an AI assistant can respond with streaming text AND rich interactive widgets. This is similar to OpenAI's ChatKit but model-agnostic and fully customizable.

## Features

- 🤖 **Streaming Chat**: Real-time text streaming with cursor animation
- 🎨 **Rich Widgets**: 6 predefined widgets + custom VDOM widgets
- 🔌 **Plugin Architecture**: Easy-to-extend widget registry system
- 📡 **SSE Streaming**: Server-Sent Events for efficient communication
- 🎯 **TypeScript**: Fully typed for safety and IDE support
- 🧩 **Modular**: Clean separation of concerns
- ⚡ **Fast**: Optimized rendering with React 18
- 💅 **Polished UI**: Built with Ant Design components

## Project Structure

```
agent/
├── client/              # React web client
│   ├── src/
│   │   ├── components/  # UI components
│   │   │   ├── Chat/    # Chat interface
│   │   │   └── Widgets/ # Widget system
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utilities and clients
│   │   └── types/       # TypeScript types
│   └── docs/            # Client documentation
└── server/              # Node.js backend
    ├── src/
    │   ├── mock/        # Mock agent & data
    │   ├── routes/      # API endpoints
    │   ├── types/       # Shared types
    │   └── utils/       # Helper functions
    └── package.json
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Terminal access

### Installation

1. **Install server dependencies:**

```bash
cd server
npm install
```

2. **Install client dependencies:**

```bash
cd ../client
npm install
```

### Running the Application

1. **Start the backend server (Terminal 1):**

```bash
cd server
npm run dev
```

Server will run on `http://localhost:3001`

2. **Start the web client (Terminal 2):**

```bash
cd client
npm run dev
```

Client will run on `http://localhost:3000`

3. **Open your browser:**

Navigate to `http://localhost:3000`

## Usage

### Try These Commands

- "Find emails from John"
- "What's on my calendar today?"
- "Book a flight to London"
- "Show me the weather"
- "Create an expense report"
- "Show my next meeting"
- "Trigger error" (to test error handling)

### Widget Actions

All widgets support interactive actions:
- Click buttons to trigger agent responses
- Submit forms to send data back
- Interact with any widget element

## Available Widgets

### Predefined Widgets

1. **EmailPreviewWidget** - Email cards with reply/archive actions
2. **CalendarEventWidget** - Meeting cards with join/decline
3. **SearchResultsWidget** - List of search results
4. **FormWidget** - Dynamic forms with validation
5. **MeetingCardWidget** - Rich meeting details with agenda
6. **FlightCardWidget** - Flight information with booking

### Custom Widgets

Use the VDOM system to create widgets on-the-fly using JSON:

```typescript
{
  type: 'custom',
  vdom: {
    component: 'Card',
    props: { title: 'Custom Widget' },
    children: [
      { component: 'Text', children: ['Hello World'] },
      { component: 'Button', props: { action: 'my_action' }, children: ['Click Me'] }
    ]
  }
}
```

## Documentation

- **[.claude.md](./client/docs/.claude.md)** - Project context for Claude
- **[WIDGET_GUIDE.md](./client/docs/WIDGET_GUIDE.md)** - Widget development guide
- **[API_PROTOCOL.md](./client/docs/API_PROTOCOL.md)** - API specification

## Architecture

### Communication Flow

```
User Input → Web Client → SSE Stream → Backend Server → Mock Agent
                ↑                            ↓
                └─── Text + Widgets ←────────┘
```

### Widget System

```
Agent Response → WidgetRenderer → Registry Lookup → Widget Component
                      ↓
                 VDOM Renderer (for custom widgets)
```

## Development

### Adding a New Widget

1. Create widget component in `client/src/components/Widgets/predefined/`
2. Register in `client/src/components/Widgets/predefined/index.ts`
3. Add mock data in `server/src/mock/widgets.ts`
4. Add scenario in `server/src/mock/scenarios.ts`

See [WIDGET_GUIDE.md](./client/docs/WIDGET_GUIDE.md) for details.

### Type Safety

All types are shared between client and server via `types/protocol.ts`. Any changes to the protocol should be made in both places.

## Technology Stack

### Frontend
- React 18
- TypeScript
- Ant Design
- TailwindCSS
- Vite
- React Markdown

### Backend
- Node.js
- Express
- TypeScript
- Server-Sent Events

## License

MIT

## Contributing

Contributions are welcome! Please read the documentation in the `docs/` folder before contributing.
