/**
 * Login Page Component
 */

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Flex } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const { login, error, clearError, isLoading } = useAuth();
  const [form] = Form.useForm();

  const handleSubmit = async (values: LoginFormValues) => {
    clearError();
    try {
      await login(values.email, values.password);
    } catch {
      // Error is handled by AuthContext
    }
  };

  return (
    <Flex
      justify="center"
      align="center"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 12,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        }}
        styles={{
          body: { padding: 40 }
        }}
      >
        <Flex vertical align="center" gap={8} style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📧</div>
          <Title level={2} style={{ margin: 0, fontWeight: 600 }}>
            Scazzy AI
          </Title>
          <Text type="secondary">Sign in with your Titan Email account</Text>
        </Flex>

        {error && (
          <Alert
            message={error.message}
            type="error"
            showIcon
            closable
            onClose={clearError}
            style={{ marginBottom: 24 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Email address"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Password"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              block
              style={{
                height: 48,
                fontSize: 16,
                fontWeight: 500,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <Text
          type="secondary"
          style={{
            display: 'block',
            textAlign: 'center',
            marginTop: 24,
            fontSize: 12,
          }}
        >
          Staging Environment
        </Text>
      </Card>
    </Flex>
  );
}
