import React from 'react';
import { Flex, Typography, Button, Space } from 'antd';
import { DeleteOutlined, RobotOutlined } from '@ant-design/icons';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useChatAgent } from '../../hooks/useChatAgent';

const { Title, Text } = Typography;

/**
 * Chat Sidebar Component
 * Main chat interface container
 */
export const ChatSidebar: React.FC = () => {
  const { messages, isLoading, status, sendMessage, handleWidgetAction, clearMessages } = useChatAgent();

  return (
    <Flex
      vertical
      style={{
        height: '100vh',
        width: '600px',
        borderRight: '1px solid #f0f0f0',
        backgroundColor: '#fff',
      }}
    >
      {/* Header */}
      <Flex
        justify="space-between"
        align="center"
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Flex align="center" gap="middle">
          <RobotOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <Flex vertical gap={0}>
            <Title level={4} style={{ margin: 0 }}>
              AI Assistant
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Chat with widgets
            </Text>
          </Flex>
        </Flex>

        <Space>
          <Button
            size="small"
            icon={<DeleteOutlined />}
            onClick={clearMessages}
            disabled={messages.length === 0}
          >
            Clear
          </Button>
        </Space>
      </Flex>

      {/* Messages */}
      <MessageList
        messages={messages}
        loading={isLoading}
        status={status}
        onWidgetAction={handleWidgetAction}
      />

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isLoading} loading={isLoading} />
    </Flex>
  );
};
