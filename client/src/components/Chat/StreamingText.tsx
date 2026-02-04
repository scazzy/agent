import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Typography } from 'antd';

const { Text } = Typography;

interface StreamingTextProps {
  content: string;
  isStreaming?: boolean;
}

/**
 * Streaming Text Component
 * Displays text with markdown support and streaming cursor
 */
export const StreamingText: React.FC<StreamingTextProps> = ({ content, isStreaming }) => {
  return (
    <div style={{ fontSize: 14, lineHeight: 1.6 }}>
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <Text style={{ display: 'block', marginBottom: 8 }}>
              {children}
              {isStreaming && <span className="streaming-cursor">▊</span>}
            </Text>
          ),
          strong: ({ children }) => <Text strong>{children}</Text>,
          em: ({ children }) => <Text italic>{children}</Text>,
          code: ({ children, ...props }) => {
            const inline = !props.className;
            return inline ? (
              <Text code>{children}</Text>
            ) : (
              <pre style={{
                background: '#f5f5f5',
                padding: '8px 12px',
                borderRadius: 4,
                overflow: 'auto'
              }}>
                <code>{children}</code>
              </pre>
            );
          },
          ul: ({ children }) => (
            <ul style={{ marginLeft: 20, marginBottom: 8 }}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{ marginLeft: 20, marginBottom: 8 }}>{children}</ol>
          ),
          li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
