import React, { useEffect, useRef } from 'react';
import { Flex, Empty, Spin } from 'antd';
import { ChatMessage } from '../../types/messages';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: ChatMessage[];
  loading?: boolean;
  status?: string | null;
  onWidgetAction?: (widgetId: string, actionType: string, actionData?: any) => void;
}

/**
 * Message List Component
 * Scrollable list of messages
 */
export const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading,
  status,
  onWidgetAction,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (messages.length === 0 && !loading) {
    return (
      <Flex
        justify="center"
        align="center"
        style={{
          height: '100%',
          padding: '32px',
        }}
      >
        <Empty
          description="No messages yet. Start a conversation!"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Flex>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        height: '100%',
      }}
    >
      <Flex vertical>
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            onWidgetAction={onWidgetAction}
          />
        ))}

        {loading && (
          <Flex justify="center" style={{ padding: '16px' }}>
            <Spin tip={status || 'Processing...'} />
          </Flex>
        )}

        <div ref={bottomRef} />
      </Flex>
    </div>
  );
};
