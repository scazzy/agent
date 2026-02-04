import React from 'react';
import { Card, Button, Space, Typography, Tag, Flex, Avatar } from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  VideoCameraOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { WidgetProps } from '../WidgetRegistry';
import { CalendarEventData } from '../../../types/protocol';

const { Text, Title } = Typography;

/**
 * Calendar Event Widget
 * Shows meeting details with join/decline actions
 */
export const CalendarEventWidget: React.FC<WidgetProps> = ({ widget, onAction }) => {
  const data = widget.data as CalendarEventData;

  const handleAction = (actionId: string) => {
    onAction?.(actionId);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'accepted':
        return 'success';
      case 'declined':
        return 'error';
      case 'tentative':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Card
      size="small"
      style={{
        marginTop: 8,
        borderTop: '3px solid #52c41a',
      }}
    >
      <Flex vertical gap="middle">
        {/* Title */}
        <Flex align="center" gap="small">
          <CalendarOutlined style={{ fontSize: 18, color: '#52c41a' }} />
          <Title level={5} style={{ margin: 0 }}>
            {data.title}
          </Title>
        </Flex>

        {/* Time */}
        <Flex align="center" gap="small">
          <ClockCircleOutlined style={{ color: '#666' }} />
          <Text>
            {formatDate(data.startTime)} • {formatTime(data.startTime)} -{' '}
            {formatTime(data.endTime)}
          </Text>
        </Flex>

        {/* Location */}
        {data.location && (
          <Flex align="center" gap="small">
            <EnvironmentOutlined style={{ color: '#666' }} />
            <Text>{data.location}</Text>
          </Flex>
        )}

        {/* Meeting Link */}
        {data.meetingLink && (
          <Flex align="center" gap="small">
            <VideoCameraOutlined style={{ color: '#1890ff' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Video call available
            </Text>
          </Flex>
        )}

        {/* Participants */}
        {data.participants && data.participants.length > 0 && (
          <Flex vertical gap="small">
            <Flex align="center" gap="small">
              <UserOutlined style={{ color: '#666' }} />
              <Text strong style={{ fontSize: 12 }}>
                Participants ({data.participants.length})
              </Text>
            </Flex>
            <Flex gap="small" wrap="wrap">
              {data.participants.map((participant, index) => (
                <Tag
                  key={index}
                  color={getStatusColor(participant.status)}
                  style={{ margin: 0 }}
                >
                  {participant.name}
                </Tag>
              ))}
            </Flex>
          </Flex>
        )}

        {/* Description */}
        {data.description && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {data.description}
          </Text>
        )}

        {/* Actions */}
        {widget.actions && widget.actions.length > 0 && (
          <Space size="small">
            {widget.actions.map((action) => (
              <Button
                key={action.id}
                size="small"
                type={action.variant === 'primary' ? 'primary' : 'default'}
                danger={action.variant === 'danger'}
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
