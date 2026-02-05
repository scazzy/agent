import { useState, useCallback, useRef } from 'react';
import { ChatMessage, WidgetActionPayload } from '../types/messages';
import { WidgetBlock, Message as ProtocolMessage } from '../types/protocol';
import { chatClient } from '../lib/chat-client';
import { authService } from '../lib/auth-service';
import { message as antdMessage } from 'antd';

/**
 * Custom hook for managing chat agent state and interactions
 */
export function useChatAgent() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [conversationId] = useState<string>(() => `conv-${Date.now()}`);
  const messagesRef = useRef<ChatMessage[]>([]);

  // Keep ref in sync with state
  messagesRef.current = messages;

  /**
   * Send a user message
   */
  const sendMessage = useCallback(
    async (content: string, widgetAction?: WidgetActionPayload) => {
      // Add user message
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Prepare assistant message
      let assistantMessageId = `msg-${Date.now() + 1}`;
      let assistantContent = '';
      let assistantWidgets: WidgetBlock[] = [];

      try {
        // Build request - use ref to avoid stale closure
        const protocolMessages: ProtocolMessage[] = messagesRef.current.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        protocolMessages.push({
          role: 'user',
          content,
          widgetAction: widgetAction
            ? {
                widgetId: widgetAction.widgetId,
                actionType: widgetAction.actionType,
                actionData: widgetAction.actionData,
              }
            : undefined,
        });

        // Get session info for authenticated API calls
        const session = authService.getSession();
        const sessionInfo = session ? {
          session: session.session,
          baseUrl: session.baseUrl,
          clusterId: session.clusterId,
        } : undefined;

        // Stream response
        const stream = chatClient.streamChat({
          messages: protocolMessages,
          conversationId,
          sessionInfo,
        });

        for await (const event of stream) {
          if (event.type === 'text_delta') {
            assistantContent += event.content;

            // Update streaming message
            setMessages((prev) => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage && lastMessage.id === assistantMessageId) {
                return [
                  ...prev.slice(0, -1),
                  {
                    ...lastMessage,
                    content: assistantContent,
                    isStreaming: true,
                  },
                ];
              } else {
                return [
                  ...prev,
                  {
                    id: assistantMessageId,
                    role: 'assistant',
                    content: assistantContent,
                    timestamp: new Date(),
                    isStreaming: true,
                  },
                ];
              }
            });
          } else if (event.type === 'widget') {
            assistantWidgets.push(event.widget);

            // Update message with widget (create assistant message if it doesn't exist)
            setMessages((prev) => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage && lastMessage.id === assistantMessageId) {
                return [
                  ...prev.slice(0, -1),
                  {
                    ...lastMessage,
                    widgets: [...assistantWidgets],
                  },
                ];
              } else {
                // Create assistant message with widgets if it doesn't exist yet
                return [
                  ...prev,
                  {
                    id: assistantMessageId,
                    role: 'assistant',
                    content: assistantContent,
                    widgets: [...assistantWidgets],
                    timestamp: new Date(),
                    isStreaming: true,
                  },
                ];
              }
            });
          } else if (event.type === 'status') {
            setStatus(event.status);
          } else if (event.type === 'error') {
            antdMessage.error(event.error.message);
            throw new Error(event.error.message);
          } else if (event.type === 'done') {
            setStatus(null);
            // Finalize message (remove streaming indicator)
            setMessages((prev) => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage && lastMessage.id === assistantMessageId) {
                return [
                  ...prev.slice(0, -1),
                  {
                    ...lastMessage,
                    isStreaming: false,
                  },
                ];
              }
              return prev;
            });
          }
        }
      } catch (error: any) {
        console.error('Chat error:', error);
        antdMessage.error(`Failed to send message: ${error.message}`);

        // Add error message
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-error-${Date.now()}`,
            role: 'assistant',
            content: `I encountered an error: ${error.message}. Please try again.`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
        setStatus(null);
      }
    },
    [conversationId]
  );

  /**
   * Handle widget action
   */
  const handleWidgetAction = useCallback(
    (widgetId: string, actionType: string, actionData?: any) => {
      const actionMessage = `Performed action: ${actionType}${
        actionData ? ` with data: ${JSON.stringify(actionData)}` : ''
      }`;

      sendMessage(actionMessage, {
        widgetId,
        actionType,
        actionData,
      });
    },
    [sendMessage]
  );

  /**
   * Clear conversation
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    status,
    sendMessage,
    handleWidgetAction,
    clearMessages,
  };
}
