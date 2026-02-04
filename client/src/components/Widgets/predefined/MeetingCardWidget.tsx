import React from 'react';
import { Card, Button, Space, Typography, Avatar, Flex, Divider, List } from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  VideoCameraOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { WidgetProps } from '../WidgetRegistry';
import { MeetingCardData } from '../../../types/protocol';

const { Text, Title } = Typography;

/**
 * Meeting Card Widget
 * Rich meeting card with agenda, attendees, and actions
 */
export const MeetingCardWidget: React.FC<WidgetProps> = ({ widget, onAction }) => {
  const data = widget.data as MeetingCardData;

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
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card
      size="small"
      style={{
        marginTop: 8,
        borderTop: '4px solid #1890ff',
      }}
    >
      <Flex vertical gap="middle">
        {/* Title */}
        <Flex align="center" gap="small">
          <CalendarOutlined style={{ fontSize: 20, color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0 }}>
            {data.title}
          </Title>
        </Flex>

        {/* Date & Time */}
        <Flex vertical gap="small">
          <Flex align="center" gap="small">
            <CalendarOutlined style={{ color: '#666' }} />
            <Text strong>{formatDate(data.startTime)}</Text>
          </Flex>
          <Flex align="center" gap="small">
            <ClockCircleOutlined style={{ color: '#666' }} />
            <Text>
              {formatTime(data.startTime)} - {formatTime(data.endTime)}
            </Text>
          </Flex>
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
            <Text type="link" style={{ fontSize: 12 }}>
              Join video call
            </Text>
          </Flex>
        )}

        <Divider style={{ margin: '8px 0' }} />

        {/* Organizer */}
        <Flex align="center" gap="small">
          <UserOutlined style={{ color: '#666' }} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Organized by <strong>{data.organizer.name}</strong>
          </Text>
        </Flex>

        {/* Attendees */}
        {data.attendees && data.attendees.length > 0 && (
          <Flex vertical gap="small">
            <Text strong style={{ fontSize: 13 }}>
              Attendees ({data.attendees.length})
            </Text>
            <Avatar.Group maxCount={5} size="small">
              {data.attendees.map((attendee, index) => (
                <Avatar
                  key={index}
                  src={attendee.avatar}
                  style={{ backgroundColor: '#1890ff' }}
                >
                  {!attendee.avatar && attendee.name.charAt(0).toUpperCase()}
                </Avatar>
              ))}
            </Avatar.Group>
            <Flex gap="small" wrap="wrap">
              {data.attendees.slice(0, 3).map((attendee, index) => (
                <Text key={index} type="secondary" style={{ fontSize: 11 }}>
                  {attendee.name}
                  {index < Math.min(2, data.attendees.length - 1) ? ',' : ''}
                </Text>
              ))}
              {data.attendees.length > 3 && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  +{data.attendees.length - 3} more
                </Text>
              )}
            </Flex>
          </Flex>
        )}

        {/* Agenda */}
        {data.agenda && data.agenda.length > 0 && (
          <Flex vertical gap="small">
            <Flex align="center" gap="small">
              <UnorderedListOutlined style={{ color: '#666' }} />
              <Text strong style={{ fontSize: 13 }}>
                Agenda
              </Text>
            </Flex>
            <List
              size="small"
              dataSource={data.agenda}
              renderItem={(item, index) => (
                <List.Item style={{ padding: '4px 0', border: 'none' }}>
                  <Text style={{ fontSize: 12 }}>
                    {index + 1}. {item}
                  </Text>
                </List.Item>
              )}
            />
          </Flex>
        )}

        {/* Actions */}
        {widget.actions && widget.actions.length > 0 && (
          <>
            <Divider style={{ margin: '8px 0' }} />
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
          </>
        )}
      </Flex>
    </Card>
  );
};
