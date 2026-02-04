/**
 * Shared Types - Protocol Definition
 * Used by both client and server for type-safe communication
 */

// ============================================================================
// Message Types
// ============================================================================

export type MessageRole = 'user' | 'assistant';

export interface WidgetAction {
  widgetId: string;
  actionType: string;
  actionData: any;
}

export interface Message {
  role: MessageRole;
  content: string;
  widgetAction?: WidgetAction;
}

export interface ChatRequest {
  messages: Message[];
  conversationId?: string;
}

// ============================================================================
// Widget Types
// ============================================================================

export interface WidgetActionDef {
  id: string;
  label: string;
  type: 'button' | 'link' | 'form';
  variant?: 'primary' | 'default' | 'danger' | 'text';
}

export interface WidgetBlock {
  id: string;
  type: string;
  data: any;
  actions?: WidgetActionDef[];
  vdom?: VDOMNode;
}

// ============================================================================
// VDOM Types (for dynamic widgets)
// ============================================================================

export interface VDOMNode {
  component: string;
  props?: Record<string, any>;
  children?: Array<VDOMNode | string>;
}

// ============================================================================
// Stream Event Types (Server-Sent Events)
// ============================================================================

export type StreamEvent =
  | TextDeltaEvent
  | WidgetEvent
  | StatusEvent
  | DoneEvent
  | ErrorEvent;

export interface TextDeltaEvent {
  type: 'text_delta';
  content: string;
}

export interface WidgetEvent {
  type: 'widget';
  widget: WidgetBlock;
}

export interface StatusEvent {
  type: 'status';
  status: string;
}

export interface DoneEvent {
  type: 'done';
}

export interface ErrorEvent {
  type: 'error';
  error: {
    message: string;
    code: string;
  };
}

// ============================================================================
// Widget Data Schemas (for predefined widgets)
// ============================================================================

export interface EmailPreviewData {
  subject: string;
  sender: {
    name: string;
    email: string;
  };
  snippet: string;
  timestamp: string;
  unread?: boolean;
}

export interface CalendarEventData {
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  participants: Array<{
    name: string;
    email: string;
    status?: 'accepted' | 'declined' | 'tentative';
  }>;
  meetingLink?: string;
  description?: string;
}

export interface SearchResultItem {
  id: string;
  title: string;
  snippet: string;
  type: 'email' | 'document' | 'meeting';
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface SearchResultsData {
  query: string;
  results: SearchResultItem[];
  totalCount: number;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    message?: string;
  };
}

export interface FormWidgetData {
  title: string;
  description?: string;
  fields: FormField[];
  submitLabel?: string;
}

export interface MeetingCardData {
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees: Array<{
    name: string;
    email: string;
    avatar?: string;
  }>;
  agenda?: string[];
  meetingLink?: string;
  organizer: {
    name: string;
    email: string;
  };
}

export interface FlightCardData {
  flightNumber: string;
  airline: string;
  departure: {
    airport: string;
    city: string;
    time: string;
    terminal?: string;
    gate?: string;
  };
  arrival: {
    airport: string;
    city: string;
    time: string;
    terminal?: string;
    gate?: string;
  };
  duration: string;
  price?: {
    amount: number;
    currency: string;
  };
  class?: 'economy' | 'business' | 'first';
  stops?: number;
}

// ============================================================================
// Error Codes
// ============================================================================

export enum ErrorCode {
  AGENT_ERROR = 'AGENT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  WIDGET_ERROR = 'WIDGET_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
