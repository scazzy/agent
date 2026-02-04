import { } from 'react';
import { ConfigProvider, Flex } from 'antd';
import { ChatSidebar } from './components/Chat/ChatSidebar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { registerPredefinedWidgets } from './components/Widgets/predefined';

// Register all widgets on app initialization
registerPredefinedWidgets();

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <ErrorBoundary>
        <Flex>
          <ChatSidebar />
          <Flex
            flex={1}
            justify="center"
            align="center"
            style={{
              height: '100vh',
              backgroundColor: '#fafafa',
              padding: 32,
            }}
          >
            <div style={{ textAlign: 'center', color: '#999' }}>
              <h1 style={{ fontSize: 48, marginBottom: 16 }}>🤖</h1>
              <h2 style={{ fontSize: 24, fontWeight: 500, marginBottom: 8 }}>
                Agentic Chat UI
              </h2>
              <p style={{ fontSize: 14 }}>
                A production-ready chat interface with rich interactive widgets
              </p>
              <p style={{ fontSize: 12, marginTop: 24 }}>
                Try asking about:
              </p>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  fontSize: 12,
                  lineHeight: 2,
                }}
              >
                <li>• "Find emails from John"</li>
                <li>• "What's on my calendar today?"</li>
                <li>• "Book a flight to London"</li>
                <li>• "Show me the weather"</li>
                <li>• "Create an expense report"</li>
                <li>• "Show my next meeting"</li>
              </ul>
            </div>
          </Flex>
        </Flex>
      </ErrorBoundary>
    </ConfigProvider>
  );
}

export default App;
