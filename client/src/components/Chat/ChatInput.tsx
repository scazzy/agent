import React, { useState, useRef, KeyboardEvent } from 'react';
import { Input, Button, Flex } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import type { TextAreaRef } from 'antd/es/input/TextArea';

const { TextArea } = Input;

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Chat Input Component
 * Text area with send button
 */
export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled, loading }) => {
  const [message, setMessage] = useState('');
  const textAreaRef = useRef<TextAreaRef>(null);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSend(trimmedMessage);
      setMessage('');
      // Refocus the input after sending
      setTimeout(() => textAreaRef.current?.focus(), 0);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Flex gap="small" align="end" style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
      <TextArea
        ref={textAreaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
        autoSize={{ minRows: 1, maxRows: 6 }}
        disabled={disabled}
        autoFocus
        style={{ flex: 1 }}
      />
      <Button
        type="primary"
        icon={<SendOutlined />}
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        loading={loading}
        size="large"
      >
        Send
      </Button>
    </Flex>
  );
};
