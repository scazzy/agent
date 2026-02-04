import { WidgetBlock, MessageRole } from './protocol';

/**
 * Client-side message types
 */

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  widgets?: WidgetBlock[];
  timestamp: Date;
  isStreaming?: boolean;
}

export interface WidgetActionPayload {
  widgetId: string;
  actionType: string;
  actionData: any;
}
