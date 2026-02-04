import React from 'react';
import { Card, Button, Space, Typography, Tag, Flex, Divider } from 'antd';
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { WidgetProps } from '../WidgetRegistry';
import { FlightCardData } from '../../../types/protocol';

const { Text, Title } = Typography;

/**
 * Flight Card Widget
 * Displays flight information with booking actions
 */
export const FlightCardWidget: React.FC<WidgetProps> = ({ widget, onAction }) => {
  const data = widget.data as FlightCardData;

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

  const getClassColor = (flightClass?: string) => {
    switch (flightClass) {
      case 'first':
        return 'gold';
      case 'business':
        return 'blue';
      case 'economy':
      default:
        return 'default';
    }
  };

  return (
    <Card
      size="small"
      style={{
        marginTop: 8,
        borderTop: '4px solid #722ed1',
      }}
    >
      <Flex vertical gap="middle">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Flex vertical>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {data.airline}
            </Text>
            <Title level={5} style={{ margin: 0 }}>
              {data.flightNumber}
            </Title>
          </Flex>
          <Flex gap="small">
            <Tag color={getClassColor(data.class)}>
              {data.class?.toUpperCase() || 'ECONOMY'}
            </Tag>
            {data.stops === 0 && <Tag color="green">NONSTOP</Tag>}
            {data.stops && data.stops > 0 && (
              <Tag color="orange">{data.stops} STOP{data.stops > 1 ? 'S' : ''}</Tag>
            )}
          </Flex>
        </Flex>

        <Divider style={{ margin: '8px 0' }} />

        {/* Flight Route */}
        <Flex justify="space-between" align="center">
          {/* Departure */}
          <Flex vertical gap="small" style={{ flex: 1 }}>
            <Title level={2} style={{ margin: 0, fontWeight: 600 }}>
              {data.departure.airport}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {data.departure.city}
            </Text>
            <Text strong style={{ fontSize: 16 }}>
              {formatTime(data.departure.time)}
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {formatDate(data.departure.time)}
            </Text>
            {data.departure.terminal && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                Terminal {data.departure.terminal}
                {data.departure.gate && ` • Gate ${data.departure.gate}`}
              </Text>
            )}
          </Flex>

          {/* Arrow & Duration */}
          <Flex vertical align="center" gap="small" style={{ padding: '0 24px' }}>
            <ArrowRightOutlined style={{ fontSize: 24, color: '#722ed1' }} />
            <Flex align="center" gap={4}>
              <ClockCircleOutlined style={{ fontSize: 12, color: '#999' }} />
              <Text type="secondary" style={{ fontSize: 11 }}>
                {data.duration}
              </Text>
            </Flex>
          </Flex>

          {/* Arrival */}
          <Flex vertical gap="small" style={{ flex: 1 }} align="end">
            <Title level={2} style={{ margin: 0, fontWeight: 600 }}>
              {data.arrival.airport}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {data.arrival.city}
            </Text>
            <Text strong style={{ fontSize: 16 }}>
              {formatTime(data.arrival.time)}
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {formatDate(data.arrival.time)}
            </Text>
            {data.arrival.terminal && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                Terminal {data.arrival.terminal}
                {data.arrival.gate && ` • Gate ${data.arrival.gate}`}
              </Text>
            )}
          </Flex>
        </Flex>

        {/* Price */}
        {data.price && (
          <>
            <Divider style={{ margin: '8px 0' }} />
            <Flex justify="space-between" align="center">
              <Flex align="center" gap="small">
                <DollarOutlined style={{ color: '#52c41a' }} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Price per person
                </Text>
              </Flex>
              <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                {data.price.currency} {data.price.amount.toFixed(2)}
              </Title>
            </Flex>
          </>
        )}

        {/* Actions */}
        {widget.actions && widget.actions.length > 0 && (
          <>
            <Divider style={{ margin: '8px 0' }} />
            <Space size="small">
              {widget.actions.map((action) => (
                <Button
                  key={action.id}
                  size="middle"
                  type={action.variant === 'primary' ? 'primary' : 'default'}
                  onClick={() => handleAction(action.id)}
                  block={action.variant === 'primary'}
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
