/**
 * Data Provider Types
 * Interfaces for email and calendar data
 */

export interface Email {
  id: string;
  subject: string;
  sender: {
    name: string;
    email: string;
  };
  recipients: {
    name: string;
    email: string;
  }[];
  snippet: string;
  body?: string;
  timestamp: string;
  unread: boolean;
  hasAttachment: boolean;
  attachments?: {
    name: string;
    type: string;
    size: number;
  }[];
  labels?: string[];
  threadId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingLink?: string;
  organizer: {
    name: string;
    email: string;
  };
  attendees: {
    name: string;
    email: string;
    status: 'accepted' | 'declined' | 'tentative' | 'pending';
  }[];
  isAllDay: boolean;
  isRecurring?: boolean;
  reminders?: {
    method: 'email' | 'popup';
    minutes: number;
  }[];
}

export interface EmailSearchQuery {
  query?: string;
  from?: string;
  to?: string;
  subject?: string;
  dateFrom?: string;
  dateTo?: string;
  hasAttachment?: boolean;
  unread?: boolean;
  labels?: string[];
  limit?: number;
}

export interface CalendarSearchQuery {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  attendee?: string;
  title?: string;
  location?: string;
  limit?: number;
}

export interface DataProvider<T, Q = Record<string, unknown>> {
  search(query: Q): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  getRecent(limit: number): Promise<T[]>;
}
