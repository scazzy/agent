import React from 'react';
import { Flex, Avatar, Card } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import { ChatMessage } from '../../types/messages';
import { StreamingText } from './StreamingText';
import { WidgetRenderer } from '../Widgets/WidgetRenderer';

interface MessageItemProps {
  message: ChatMessage;
  onWidgetAction?: (widgetId: string, actionType: string, actionData?: any) => void;
}

/**
 * Message Item Component
 * Displays a single message with text and widgets
 */
export const MessageItem: React.FC<MessageItemProps> = ({ message, onWidgetAction }) => {
  const isUser = message.role === 'user';

  const handleWidgetAction = (widgetId: string) => {
    return (actionType: string, actionData?: any) => {
      onWidgetAction?.(widgetId, actionType, actionData);
    };
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Flex
      gap="middle"
      align="start"
      style={{
        padding: '16px',
        flexDirection: isUser ? 'row-reverse' : 'row',
      }}
    >
      {/* Avatar */}
      <Avatar
        icon={isUser ? <UserOutlined /> : <RobotOutlined />}
        style={{
          backgroundColor: isUser ? '#1890ff' : '#52c41a',
          flexShrink: 0,
        }}
      />

      {/* Content */}
      <Flex
        vertical
        gap="small"
        style={{
          maxWidth: '70%',
          flex: 1,
        }}
      >
        {/* Message Card */}
        <Card
          size="small"
          style={{
            backgroundColor: isUser ? '#e6f7ff' : '#f5f5f5',
            border: 'none',
          }}
        >
          <StreamingText content={message.content} isStreaming={message.isStreaming} />
        </Card>

        {/* Widgets */}
        {message.widgets && message.widgets.length > 0 && (
          <Flex vertical gap="small">
            {message.widgets.map((widget) => (
              <WidgetRenderer
                key={widget.id}
                widget={widget}
                onAction={handleWidgetAction(widget.id)}
              />
            ))}
          </Flex>
        )}

        {/* Timestamp */}
        <span style={{ fontSize: 11, color: '#999', alignSelf: isUser ? 'flex-end' : 'flex-start' }}>
          {formatTime(message.timestamp)}
        </span>
      </Flex>
    </Flex>
  );
};
