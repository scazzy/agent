import React from 'react';
import { Card, Button, Space, Typography, List, Tag, Flex } from 'antd';
import {
  FileTextOutlined,
  MailOutlined,
  CalendarOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { WidgetProps } from '../WidgetRegistry';
import { SearchResultsData, SearchResultItem } from '../../../types/protocol';

const { Text, Title } = Typography;

/**
 * Search Results Widget
 * Shows list of search results (emails/docs/meetings)
 */
export const SearchResultsWidget: React.FC<WidgetProps> = ({ widget, onAction }) => {
  const data = widget.data as SearchResultsData;

  const handleAction = (actionId: string) => {
    onAction?.(actionId);
  };

  const handleResultClick = (result: SearchResultItem) => {
    onAction?.('open_result', { resultId: result.id });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <MailOutlined style={{ color: '#1890ff' }} />;
      case 'document':
        return <FileTextOutlined style={{ color: '#52c41a' }} />;
      case 'meeting':
        return <CalendarOutlined style={{ color: '#faad14' }} />;
      default:
        return <FileTextOutlined />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'blue';
      case 'document':
        return 'green';
      case 'meeting':
        return 'orange';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card
      size="small"
      style={{
        marginTop: 8,
      }}
    >
      <Flex vertical gap="middle">
        {/* Header */}
        <Flex align="center" gap="small">
          <SearchOutlined style={{ fontSize: 16, color: '#1890ff' }} />
          <Title level={5} style={{ margin: 0 }}>
            Search Results
          </Title>
          <Tag color="blue">{data.totalCount} found</Tag>
        </Flex>

        {/* Query */}
        <Text type="secondary" style={{ fontSize: 12 }}>
          Query: <Text code>{data.query}</Text>
        </Text>

        {/* Results List */}
        <List
          size="small"
          dataSource={data.results}
          renderItem={(result) => (
            <List.Item
              style={{
                cursor: 'pointer',
                padding: '8px 0',
                borderRadius: 4,
              }}
              onClick={() => handleResultClick(result)}
              extra={
                result.timestamp && (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {formatTimestamp(result.timestamp)}
                  </Text>
                )
              }
            >
              <List.Item.Meta
                avatar={getTypeIcon(result.type)}
                title={
                  <Flex gap="small" align="center">
                    <Text strong style={{ fontSize: 13 }}>
                      {result.title}
                    </Text>
                    <Tag color={getTypeColor(result.type)} style={{ fontSize: 10 }}>
                      {result.type}
                    </Tag>
                  </Flex>
                }
                description={
                  <Text
                    type="secondary"
                    style={{ fontSize: 12 }}
                    ellipsis={{ tooltip: result.snippet }}
                  >
                    {result.snippet}
                  </Text>
                }
              />
            </List.Item>
          )}
        />

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
