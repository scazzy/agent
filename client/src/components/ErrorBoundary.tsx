import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Card, Flex } from 'antd';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches errors in widget rendering and shows fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card size="small" style={{ marginTop: 8 }}>
          <Flex vertical gap="middle">
            <Alert
              type="error"
              message="Widget Error"
              description={
                <Flex vertical gap="small">
                  <span>{this.state.error?.message || 'An unknown error occurred'}</span>
                  {this.state.errorInfo && (
                    <details style={{ marginTop: 8 }}>
                      <summary style={{ cursor: 'pointer', userSelect: 'none' }}>
                        View stack trace
                      </summary>
                      <pre
                        style={{
                          marginTop: 8,
                          padding: 8,
                          backgroundColor: '#f5f5f5',
                          borderRadius: 4,
                          fontSize: 11,
                          overflow: 'auto',
                          maxHeight: 200,
                        }}
                      >
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </Flex>
              }
              showIcon
            />
            <Button type="primary" size="small" onClick={this.handleReset}>
              Retry
            </Button>
          </Flex>
        </Card>
      );
    }

    return this.props.children;
  }
}
