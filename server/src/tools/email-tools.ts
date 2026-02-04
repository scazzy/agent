/**
 * Email Tools
 * Tool definitions and handlers for email operations
 */

import { ToolDefinition, ToolHandler, ToolResult } from '../types/tools';
import { EmailProvider } from '../providers/email-provider';
import { Email } from '../providers/types';
import { WidgetBlock } from '../types/protocol';

// Tool Definitions

export const searchEmailsTool: ToolDefinition = {
  name: 'search_emails',
  description:
    'Search emails by various criteria. Use this to find emails from specific senders, with specific subjects, or containing certain content.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Free-text search query to match against subject, body, and sender',
      },
      from: {
        type: 'string',
        description: 'Filter by sender name or email address',
      },
      subject: {
        type: 'string',
        description: 'Filter by subject line (partial match)',
      },
      dateFrom: {
        type: 'string',
        description: 'Start date for date range filter (ISO 8601 format)',
      },
      dateTo: {
        type: 'string',
        description: 'End date for date range filter (ISO 8601 format)',
      },
      hasAttachment: {
        type: 'boolean',
        description: 'Filter to only emails with attachments',
      },
      unread: {
        type: 'boolean',
        description: 'Filter to only unread emails',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 10)',
      },
    },
    required: [],
  },
};

export const getEmailDetailsTool: ToolDefinition = {
  name: 'get_email_details',
  description: 'Get the full details of a specific email by its ID',
  parameters: {
    type: 'object',
    properties: {
      emailId: {
        type: 'string',
        description: 'The unique ID of the email to retrieve',
      },
    },
    required: ['emailId'],
  },
};

export const getUnreadEmailsTool: ToolDefinition = {
  name: 'get_unread_emails',
  description: 'Get all unread emails, optionally filtered by sender or subject',
  parameters: {
    type: 'object',
    properties: {
      from: {
        type: 'string',
        description: 'Optional: filter by sender',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results (default: 10)',
      },
    },
    required: [],
  },
};

// Widget creation helper
function createEmailWidget(email: Email): WidgetBlock {
  return {
    id: `email-widget-${email.id}`,
    type: 'email_preview',
    data: {
      subject: email.subject,
      sender: email.sender,
      snippet: email.snippet,
      timestamp: email.timestamp,
      unread: email.unread,
      hasAttachment: email.hasAttachment,
    },
    actions: [
      { id: 'reply', label: 'Reply', type: 'button' as const, variant: 'primary' as const },
      { id: 'archive', label: 'Archive', type: 'button' as const, variant: 'default' as const },
      { id: 'open', label: 'Open', type: 'link' as const },
    ],
  };
}

// Tool Handler Factories

export function createSearchEmailsHandler(provider: EmailProvider): ToolHandler {
  return async (args: Record<string, unknown>): Promise<ToolResult> => {
    try {
      const results = await provider.search({
        query: args.query as string | undefined,
        from: args.from as string | undefined,
        subject: args.subject as string | undefined,
        dateFrom: args.dateFrom as string | undefined,
        dateTo: args.dateTo as string | undefined,
        hasAttachment: args.hasAttachment as boolean | undefined,
        unread: args.unread as boolean | undefined,
        limit: (args.limit as number) || 10,
      });

      return {
        success: true,
        data: {
          count: results.length,
          emails: results.map(e => ({
            id: e.id,
            subject: e.subject,
            sender: e.sender,
            snippet: e.snippet,
            timestamp: e.timestamp,
            unread: e.unread,
            hasAttachment: e.hasAttachment,
          })),
        },
        widgets: results.map(createEmailWidget),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to search emails: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };
}

export function createGetEmailDetailsHandler(provider: EmailProvider): ToolHandler {
  return async (args: Record<string, unknown>): Promise<ToolResult> => {
    try {
      const emailId = args.emailId as string;
      const email = await provider.getById(emailId);

      if (!email) {
        return {
          success: false,
          error: `Email not found: ${emailId}`,
        };
      }

      return {
        success: true,
        data: email,
        widgets: [createEmailWidget(email)],
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get email details: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };
}

export function createGetUnreadEmailsHandler(provider: EmailProvider): ToolHandler {
  return async (args: Record<string, unknown>): Promise<ToolResult> => {
    try {
      const results = await provider.search({
        unread: true,
        from: args.from as string | undefined,
        limit: (args.limit as number) || 10,
      });

      return {
        success: true,
        data: {
          count: results.length,
          emails: results.map(e => ({
            id: e.id,
            subject: e.subject,
            sender: e.sender,
            snippet: e.snippet,
            timestamp: e.timestamp,
            hasAttachment: e.hasAttachment,
          })),
        },
        widgets: results.map(createEmailWidget),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get unread emails: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };
}

// Register all email tools
export function registerEmailTools(
  registry: { register: (def: ToolDefinition, handler: ToolHandler) => void },
  provider: EmailProvider
): void {
  registry.register(searchEmailsTool, createSearchEmailsHandler(provider));
  registry.register(getEmailDetailsTool, createGetEmailDetailsHandler(provider));
  registry.register(getUnreadEmailsTool, createGetUnreadEmailsHandler(provider));
}
