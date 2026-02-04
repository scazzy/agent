import React from 'react';
import { Card, Button, Space, Typography, Badge, Flex } from 'antd';
import { MailOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { WidgetProps } from '../WidgetRegistry';
import { EmailPreviewData } from '../../../types/protocol';

const { Text, Paragraph } = Typography;

/**
 * Email Preview Widget
 * Shows email subject, sender, snippet with actions
 */
export const EmailPreviewWidget: React.FC<WidgetProps> = ({ widget, onAction }) => {
  const data = widget.data as EmailPreviewData;

  const handleAction = (actionId: string) => {
    onAction?.(actionId);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  return (
    <Card
      size="small"
      style={{
        marginTop: 8,
        borderLeft: data.unread ? '3px solid #1890ff' : undefined,
      }}
    >
      <Flex vertical gap="small">
        {/* Header */}
        <Flex justify="space-between" align="start">
          <Flex gap="small" align="center">
            <MailOutlined style={{ fontSize: 16, color: '#1890ff' }} />
            {data.unread && <Badge status="processing" />}
            <Text strong>{data.subject}</Text>
          </Flex>
          <Flex align="center" gap={4}>
            <ClockCircleOutlined style={{ fontSize: 12, color: '#999' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatTimestamp(data.timestamp)}
            </Text>
          </Flex>
        </Flex>

        {/* Sender */}
        <Text type="secondary" style={{ fontSize: 13 }}>
          From: <strong>{data.sender.name}</strong> &lt;{data.sender.email}&gt;
        </Text>

        {/* Snippet */}
        <Paragraph
          ellipsis={{ rows: 2 }}
          style={{ marginBottom: 8, fontSize: 13, color: '#666' }}
        >
          {data.snippet}
        </Paragraph>

        {/* Actions */}
        {widget.actions && widget.actions.length > 0 && (
          <Space size="small">
            {widget.actions.map((action) => (
              <Button
                key={action.id}
                size="small"
                type={action.variant === 'primary' ? 'primary' : 'default'}
                onClick={() => handleAction(action.id)}
              >
                {action.label}
              </Button>
            ))}
          </Space>
        )}
      </Flex>
    </Card>
  );
};
