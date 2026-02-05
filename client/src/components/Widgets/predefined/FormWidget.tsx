import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  Space,
  Typography,
  Flex,
  message,
} from 'antd';
import { FormOutlined } from '@ant-design/icons';
import { WidgetProps } from '../WidgetRegistry';
import { FormWidgetData, FormField } from '../../../types/protocol';

const { TextArea } = Input;
const { Title, Text } = Typography;

/**
 * Form Widget
 * Dynamic form with validation and submit action
 */
export const FormWidget: React.FC<WidgetProps> = ({ widget, onAction }) => {
  const data = widget.data as FormWidgetData;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Guard against missing data
  if (!data || !data.fields) {
    // Fallback: if there's HTML content, render it
    if (data?.content) {
      return (
        <Card size="small" style={{ marginTop: 8 }}>
          <div 
            dangerouslySetInnerHTML={{ __html: data.content }} 
            style={{ maxHeight: 400, overflow: 'auto' }}
          />
        </Card>
      );
    }
    // Fallback: if there's questions array (NPS survey format), convert to simple display
    if (data?.questions) {
      return (
        <Card size="small" style={{ marginTop: 8 }}>
          <Flex vertical gap="small">
            {data.title && <Title level={5} style={{ margin: 0 }}>{data.title}</Title>}
            {data.questions.map((q: any, i: number) => (
              <Text key={i}>• {q.label || q.question || JSON.stringify(q)}</Text>
            ))}
          </Flex>
        </Card>
      );
    }
    return (
      <Card size="small" style={{ marginTop: 8 }}>
        <Text type="danger">Form data is incomplete or missing fields</Text>
      </Card>
    );
  }

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await onAction?.('submit', values);
      message.success('Form submitted successfully!');
      form.resetFields();
    } catch (error) {
      message.error('Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onAction?.('cancel');
  };

  const renderField = (field: FormField) => {
    const commonProps = {
      placeholder: field.placeholder,
    };

    switch (field.type) {
      case 'text':
      case 'email':
        return <Input {...commonProps} type={field.type} />;

      case 'number':
        return (
          <InputNumber
            {...commonProps}
            style={{ width: '100%' }}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'date':
        return <DatePicker {...commonProps} style={{ width: '100%' }} />;

      case 'select':
        return (
          <Select {...commonProps} options={field.options} />
        );

      case 'textarea':
        return <TextArea {...commonProps} rows={4} />;

      default:
        return <Input {...commonProps} />;
    }
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
          <FormOutlined style={{ fontSize: 16, color: '#1890ff' }} />
          <Title level={5} style={{ margin: 0 }}>
            {data.title}
          </Title>
        </Flex>

        {/* Description */}
        {data.description && (
          <Text type="secondary" style={{ fontSize: 13 }}>
            {data.description}
          </Text>
        )}

        {/* Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 8 }}
        >
          {data.fields.map((field, index) => {
            const fieldId = field.id || `field-${index}`;
            const fieldLabel = field.label || field.name || `Field ${index + 1}`;
            
            return (
              <Form.Item
                key={fieldId}
                name={fieldId}
                label={fieldLabel}
                rules={[
                  {
                    required: field.required,
                    message: `Please enter ${fieldLabel.toLowerCase()}`,
                  },
                  field.validation?.pattern
                    ? {
                        pattern: new RegExp(field.validation.pattern),
                        message:
                          field.validation.message ||
                          `Invalid ${fieldLabel.toLowerCase()}`,
                      }
                    : {},
                ]}
              >
                {renderField(field)}
              </Form.Item>
            );
          })}

          {/* Actions */}
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {data.submitLabel || 'Submit'}
              </Button>
              <Button onClick={handleCancel}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Flex>
    </Card>
  );
};
