/**
 * Login Page Component
 */

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Flex, Switch } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { AuthService } from '../../lib/auth-service';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const { login, error, clearError, isLoading } = useAuth();
  const [form] = Form.useForm();
  const [isProduction, setIsProduction] = useState(() => {
    return localStorage.getItem('titan_env') === 'production';
  });

  const handleEnvChange = (checked: boolean) => {
    setIsProduction(checked);
    AuthService.setEnvironment(checked ? 'production' : 'staging');
  };

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
        background: isProduction 
          ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 24,
        position: 'relative',
      }}
    >
      {/* Environment Switch */}
      <Flex
        align="center"
        gap={8}
        style={{
          position: 'absolute',
          top: 16,
          right: 24,
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '8px 16px',
          borderRadius: 20,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Text style={{ fontSize: 12, color: isProduction ? '#999' : '#667eea', fontWeight: 500 }}>
          Staging
        </Text>
        <Switch
          checked={isProduction}
          onChange={handleEnvChange}
          size="small"
          style={{ 
            backgroundColor: isProduction ? '#11998e' : undefined 
          }}
        />
        <Text style={{ fontSize: 12, color: isProduction ? '#11998e' : '#999', fontWeight: 500 }}>
          Production
        </Text>
      </Flex>

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
            Project Sophia
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
          style={{
            display: 'block',
            textAlign: 'center',
            marginTop: 24,
            fontSize: 12,
            color: isProduction ? '#11998e' : '#667eea',
            fontWeight: 500,
          }}
        >
          {isProduction ? '🟢 Production Environment' : '🟣 Staging Environment'}
        </Text>
      </Card>
    </Flex>
  );
}
