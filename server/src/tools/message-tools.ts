/**
 * Message Tools
 * Tool definitions and handlers for fetching real messages from Titan Mail
 */

import { ToolDefinition, ToolModel, ToolHandler, ToolResult } from '../types/tools';
import { TitanMailProvider, TitanMessage, TitanThread, Participant } from '../providers/titan-mail-provider';
import { WidgetBlock } from '../types/protocol';

// Tool Definitions

export const fetchMessagesTool: ToolModel = {
  name: 'fetch_messages',
  description:
    'Fetch email messages from inbox. Returns latest emails sorted by date. Supports filtering by unread and date. Use for "new emails today", "unread emails", "my inbox".',
  parameters: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Number of messages to fetch (default: 10, max: 50)',
      },
      folderType: {
        type: 'string',
        description: 'Folder type: INBOX, SENT, DRAFTS, TRASH, SPAM (default: INBOX)',
      },
      unreadOnly: {
        type: 'boolean',
        description: 'Filter only unread emails. Default: null. Set true ONLY when user explicitly says "unread" or "new emails". Do NOT assume.',
      },
      filterDate: {
        type: 'string',
        description: 'Filter emails from this date only (yyyy-mm-dd). Use for "emails today", "new emails today". Messages will be filtered client-side.',
      },
    },
    required: [],
  },
  domain: 'email',
  action: { type: 'api', apiName: 'fetch_messages' },
  usage: {
    when: [
      'User wants latest/recent emails: "show my inbox", "my emails"',
      'User asks for unread: "unread emails", "new messages" → unreadOnly: true',
      'User asks for new emails today: "new emails today", "any emails today" → unreadOnly: true, filterDate: today',
      'User wants emails from today without search criteria → filterDate: today',
    ],
    notWhen: [
      'User is searching by sender, subject, or keywords → use titan_search_emails',
      'User asks for emails from a specific sender or about a topic → use titan_search_emails',
    ],
    prerequisites: ['Requires authentication'],
    outputFormat: 'both',
  },
};

export const fetchMessageSnippetTool: ToolModel = {
  name: 'fetch_message_snippet',
  description:
    'Fetch the body snippet/preview of a specific email message. Use this to get more details about an email.',
  parameters: {
    type: 'object',
    properties: {
      messageId: {
        type: 'string',
        description: 'The message ID (mid) to fetch snippet for',
      },
      length: {
        type: 'number',
        description: 'Snippet length (default: 1000, max: 5000)',
      },
    },
    required: ['messageId'],
  },
  domain: 'email',
  action: { type: 'api', apiName: 'fetch_message_snippet' },
  usage: {
    when: ['User wants a preview of a specific email', 'Need more details about a message'],
    prerequisites: ['Requires authentication', 'Requires a messageId from a previous fetch'],
    outputFormat: 'text',
  },
};

export const fetchMessageBodyTool: ToolModel = {
  name: 'fetch_message_body',
  description:
    'Fetch the full body content of a specific email message. Use when user wants to read the complete email.',
  parameters: {
    type: 'object',
    properties: {
      messageId: {
        type: 'string',
        description: 'The message ID (mid)',
      },
      messageHeaderId: {
        type: 'string',
        description: 'The message header ID (mhid)',
      },
    },
    required: ['messageId', 'messageHeaderId'],
  },
  domain: 'email',
  action: { type: 'api', apiName: 'fetch_message_body' },
  usage: {
    when: ['User wants to read the full content of a specific email'],
    prerequisites: ['Requires authentication', 'Requires messageId and messageHeaderId from a previous fetch'],
    outputFormat: 'text',
  },
};

export const titanSearchEmailsTool: ToolModel = {
  name: 'titan_search_emails',
  description:
    'Search emails with flexible filters: text search, date ranges, unread status, sender/recipient, subject, attachments. Use this for date-based queries or any search with specific criteria.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Full-text search. Include ONLY key nouns/topics (not verbs or filler words). Example: "insurance proof" NOT "insurance proof submitted by user". Keep it concise - 2-4 words max.',
      },
      from: {
        type: 'array',
        description: 'Filter by sender email. Use ONLY if user provides a complete email like "john@company.com". If user says just a name like "john", put the name in query instead.',
        items: { type: 'string', description: 'Sender email address' },
      },
      to: {
        type: 'array',
        description: 'Filter by recipient email. Use ONLY if user provides a complete email address.',
        items: { type: 'string', description: 'Recipient email address' },
      },
      subject: {
        type: 'array',
        description: 'Subject line keywords',
        items: { type: 'string', description: 'Subject keyword' },
      },
      folder: {
        type: 'string',
        description: 'Folder name to search in (e.g., INBOX, SENT)',
      },
      startDate: {
        type: 'string',
        description: 'Start date for date range filter (yyyy-mm-dd). IMPORTANT: Use for "today", "this week", "yesterday" queries. For "today", use today\'s date as both startDate and endDate.',
      },
      endDate: {
        type: 'string',
        description: 'End date for date range filter (yyyy-mm-dd). For "today", use same date as startDate. For "this week", use end of week.',
      },
      unreadOnly: {
        type: 'boolean',
        description: 'Filter only unread emails. Default: false. Set true ONLY when user explicitly says "unread", "new emails", or "haven\'t read". Do NOT assume unread.',
      },
      starredOnly: {
        type: 'boolean',
        description: 'Filter to only starred emails',
      },
      hasAttachment: {
        type: 'boolean',
        description: 'Filter to only emails with attachments',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results (default: 20, max: 200)',
      },
    },
    required: [],
  },
  domain: 'email',
  action: { type: 'api', apiName: 'titan_search_emails' },
  usage: {
    when: [
      'User asks for emails from a specific date: "emails today", "emails this week", "emails yesterday" - use startDate/endDate',
      'User asks for "new emails today" or "unread emails today" - combine unreadOnly: true with startDate/endDate',
      'User is searching for specific emails with keywords, sender, subject',
      'User asks to "find", "search", "look for" emails with any criteria',
    ],
    notWhen: [
      'User just wants latest inbox without date/search criteria - use fetch_messages',
      'User only wants "unread emails" without date filter - use fetch_messages with unreadOnly: true',
    ],
    prerequisites: ['Requires authentication'],
    outputFormat: 'both',
  },
};

// Helper to normalize participant to simple format
function normalizeParticipant(p: Participant | Participant[] | undefined): { name: string; email: string } {
  if (!p) return { name: 'Unknown', email: '' };
  const participant = Array.isArray(p) ? p[0] : p;
  if (!participant) return { name: 'Unknown', email: '' };
  return {
    name: participant.name || participant.fn || participant.email || 'Unknown',
    email: participant.email || '',
  };
}

// Helper to check if message is unread from state bitset
function isUnread(message: TitanMessage): boolean {
  if (message.u !== undefined) return message.u;
  if (message.state !== undefined) return (message.state & 1) === 1; // bit 0 is unread
  return true;
}

// Helper to check if message has attachment
function hasAttachment(message: TitanMessage): boolean {
  if (message.files && message.files.length > 0) return true;
  if (message.state !== undefined) return (message.state & 8) === 8; // bit 3 is attachment
  return false;
}

// Helper to get timestamp from message
function getTimestamp(message: TitanMessage): string {
  // Search API returns createdAt
  if (message.createdAt) {
    return new Date(message.createdAt).toISOString();
  }
  // Messages API returns headers.date
  if (message.headers?.date) {
    return new Date(message.headers.date).toISOString();
  }
  return new Date().toISOString();
}

// Widget creation helper
function createMessageWidget(message: TitanMessage): WidgetBlock {
  console.log('[createMessageWidget] Input message keys:', Object.keys(message));
  console.log('[createMessageWidget] mid:', message.mid);
  console.log('[createMessageWidget] subject:', message.subject);
  console.log('[createMessageWidget] from:', JSON.stringify(message.from));
  console.log('[createMessageWidget] snippet:', message.snippet?.substring(0, 100));
  
  const sender = normalizeParticipant(message.from);
  const mhid = message.mhid || message.headers?.mhid || '';
  
  const widget: WidgetBlock = {
    id: `msg-widget-${message.mid}`,
    type: 'email_preview',
    data: {
      messageId: message.mid,
      messageHeaderId: mhid,
      subject: message.subject || '(No Subject)',
      sender,
      snippet: message.snippet || '',
      timestamp: getTimestamp(message),
      unread: isUnread(message),
      hasAttachment: hasAttachment(message),
    },
    actions: [
      { id: 'read', label: 'Read', type: 'button' as const, variant: 'primary' as const },
      { id: 'reply', label: 'Reply', type: 'button' as const, variant: 'default' as const },
      { id: 'archive', label: 'Archive', type: 'button' as const, variant: 'default' as const },
    ],
  };
  
  console.log('[createMessageWidget] Created widget:', JSON.stringify(widget, null, 2));
  return widget;
}

// Widget creation for thread
function createThreadWidget(thread: TitanThread): WidgetBlock {
  const sender = thread.tp?.from?.[0] 
    ? normalizeParticipant(thread.tp.from[0])
    : { name: 'Unknown', email: '' };
  
  return {
    id: `thread-widget-${thread.tid}`,
    type: 'email_preview',
    data: {
      threadId: thread.tid,
      subject: thread.subject || '(No Subject)',
      sender,
      snippet: thread.snippet || '',
      timestamp: thread.last_message_recieved_timestamp 
        ? new Date(thread.last_message_recieved_timestamp).toISOString()
        : new Date().toISOString(),
      unread: thread.u ?? (thread.unread_count ? thread.unread_count > 0 : false),
      hasAttachment: thread.a ?? (thread.attachment_count ? thread.attachment_count > 0 : false),
      messageCount: thread.msg_count,
    },
    actions: [
      { id: 'open', label: 'Open', type: 'button' as const, variant: 'primary' as const },
      { id: 'reply', label: 'Reply', type: 'button' as const, variant: 'default' as const },
      { id: 'archive', label: 'Archive', type: 'button' as const, variant: 'default' as const },
    ],
  };
}

// Tool Handler Factories

export function createFetchMessagesHandler(provider: TitanMailProvider): ToolHandler {
  return async (args: Record<string, unknown>): Promise<ToolResult> => {
    console.log('\n[MessageTools] ========== fetch_messages CALLED ==========');
    console.log('[MessageTools] Args:', JSON.stringify(args));
    
    try {
      if (!provider.hasSession()) {
        console.error('[MessageTools] ERROR: No session available!');
        return {
          success: false,
          error: 'Not authenticated. Please login first.',
        };
      }

      // If filtering by date, fetch more to ensure we get enough after filtering
      const filterDate = args.filterDate as string | undefined;
      const requestedLimit = Math.min((args.limit as number) || 10, 50);
      const fetchLimit = filterDate ? Math.min(requestedLimit * 3, 100) : requestedLimit; // Fetch more if filtering
      
      const folderType = (args.folderType as string) || 'INBOX';
      const unreadOnly = args.unreadOnly as boolean;

      console.log(`[MessageTools] Params: limit=${requestedLimit}, fetchLimit=${fetchLimit}, folder=${folderType}, unreadOnly=${unreadOnly}, filterDate=${filterDate}`);

      // Build filter state bitmask
      let filterState: number | undefined;
      if (unreadOnly) {
        filterState = 2; // bit 1 = UNREAD
      }

      const response = await provider.fetchMessages({
        limit: fetchLimit,
        folderType,
        filterState,
        cursor: null,
      });
      let messages = response.messages;

      console.log(`[MessageTools] Received ${messages.length} messages from Titan API`);

      // Filter by date client-side if requested
      if (filterDate) {
        const targetDate = new Date(filterDate);
        const targetDateStr = targetDate.toISOString().split('T')[0]; // yyyy-mm-dd
        
        messages = messages.filter(m => {
          const msgTimestamp = getTimestamp(m);
          if (!msgTimestamp) return false;
          const msgDateStr = new Date(msgTimestamp).toISOString().split('T')[0];
          return msgDateStr === targetDateStr;
        });
        
        console.log(`[MessageTools] After date filter (${filterDate}): ${messages.length} messages`);
        
        // Limit to requested amount after filtering
        messages = messages.slice(0, requestedLimit);
      }

      if (messages.length > 0) {
        console.log('[MessageTools] First message sample:', JSON.stringify(messages[0], null, 2).substring(0, 500));
      }

      const widgets = messages.map(createMessageWidget);
      console.log(`[MessageTools] Created ${widgets.length} widgets`);
      console.log('[MessageTools] ========================================\n');

      return {
        success: true,
        data: {
          count: messages.length,
          filterDate: filterDate || null,
          unreadOnly: unreadOnly || false,
          messages: messages.map(m => ({
            id: m.mid,
            subject: m.subject,
            from: normalizeParticipant(m.from),
            snippet: m.snippet,
            timestamp: getTimestamp(m),
            unread: isUnread(m),
          })),
          hasMore: response.messages.length === fetchLimit,
        },
        widgets,
      };
    } catch (error) {
      console.error('[MessageTools] fetchMessages error:', error);
      return {
        success: false,
        error: `Failed to fetch messages: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };
}

export function createFetchMessageSnippetHandler(provider: TitanMailProvider): ToolHandler {
  return async (args: Record<string, unknown>): Promise<ToolResult> => {
    try {
      if (!provider.hasSession()) {
        return {
          success: false,
          error: 'Not authenticated. Please login first.',
        };
      }

      const messageId = args.messageId as string;
      const length = (args.length as number) || 1000;

      const snippet = await provider.fetchMessageSnippet(messageId, length);

      return {
        success: true,
        data: {
          messageId,
          snippet,
        },
      };
    } catch (error) {
      console.error('[MessageTools] fetchMessageSnippet error:', error);
      return {
        success: false,
        error: `Failed to fetch message snippet: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };
}

export function createFetchMessageBodyHandler(provider: TitanMailProvider): ToolHandler {
  return async (args: Record<string, unknown>): Promise<ToolResult> => {
    try {
      if (!provider.hasSession()) {
        return {
          success: false,
          error: 'Not authenticated. Please login first.',
        };
      }

      const messageId = args.messageId as string;
      const messageHeaderId = args.messageHeaderId as string;

      const response = await provider.fetchMessageBody(messageId, messageHeaderId);

      return {
        success: true,
        data: {
          messageId,
          body: response.body,
          readCount: response.rc,
        },
      };
    } catch (error) {
      console.error('[MessageTools] fetchMessageBody error:', error);
      return {
        success: false,
        error: `Failed to fetch message body: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };
}

export function createTitanSearchEmailsHandler(provider: TitanMailProvider): ToolHandler {
  return async (args: Record<string, unknown>): Promise<ToolResult> => {
    try {
      if (!provider.hasSession()) {
        return {
          success: false,
          error: 'Not authenticated. Please login first.',
        };
      }

      // Query is OPTIONAL - can search by filters alone (date, unread, etc.)
      const query = (args.query as string) || '';
      
      // Validate that we have at least some search criteria
      const hasDateFilter = args.startDate || args.endDate;
      const hasOtherFilters = args.unreadOnly || args.starredOnly || args.hasAttachment || args.from || args.to || args.subject;
      
      if (!query && !hasDateFilter && !hasOtherFilters) {
        return {
          success: false,
          error: 'Search requires at least a query, date filter, or other filter (unreadOnly, from, etc.)',
        };
      }
      
      console.log(`[TitanSearch] Params: query="${query}", startDate=${args.startDate}, endDate=${args.endDate}, unreadOnly=${args.unreadOnly}`);

      // Validate from/to emails - reject obvious fabrications
      const fromEmails = args.from as string[] | undefined;
      const toEmails = args.to as string[] | undefined;
      
      // Check for common fabricated email patterns
      const isFabricatedEmail = (email: string): boolean => {
        const fabricatedDomains = ['company.com', 'domain.com', 'example.com', 'email.com', 'mail.com', 'test.com', 'fake.com', 'sample.com'];
        const domain = email.split('@')[1]?.toLowerCase();
        return fabricatedDomains.includes(domain);
      };
      
      // Filter out fabricated emails and log warnings
      const cleanFromEmails = fromEmails?.filter(email => {
        if (isFabricatedEmail(email)) {
          console.warn(`[TitanSearch] Ignoring fabricated email in 'from': ${email} - name should be in query instead`);
          return false;
        }
        return true;
      });
      
      const cleanToEmails = toEmails?.filter(email => {
        if (isFabricatedEmail(email)) {
          console.warn(`[TitanSearch] Ignoring fabricated email in 'to': ${email}`);
          return false;
        }
        return true;
      });

      console.log(`[TitanSearch] Query: "${query}", from: ${JSON.stringify(cleanFromEmails)}, to: ${JSON.stringify(cleanToEmails)}`);

      const searchParams = {
        words: query,
        from: cleanFromEmails?.length ? cleanFromEmails : undefined,
        to: cleanToEmails?.length ? cleanToEmails : undefined,
        subject: args.subject as string[] | undefined,
        in: args.folder as string | undefined,
        df: (args.startDate || args.endDate) ? {
          st: args.startDate as string | undefined,
          en: args.endDate as string | undefined,
        } : undefined,
        u: args.unreadOnly as boolean | undefined,
        s: args.starredOnly as boolean | undefined,
        ha: args.hasAttachment as boolean | undefined,
        ps: Math.min((args.limit as number) || 20, 200),
        type: 'm' as const, // Return messages, not threads
      };

      const response = await provider.searchEmails(searchParams);

      // API returns "m" for messages, "t" for threads
      const messages = response.m || [];
      const threads = response.t || [];

      console.log(`[MessageTools] Search returned ${messages.length} messages, ${threads.length} threads`);
      if (messages.length > 0) {
        console.log('[MessageTools] First search result:', JSON.stringify(messages[0], null, 2).substring(0, 500));
      }

      // Create widgets for results
      const widgets: WidgetBlock[] = [
        ...messages.map(createMessageWidget),
        ...threads.map(createThreadWidget),
      ];

      console.log(`[MessageTools] Created ${widgets.length} widgets from search results`);

      return {
        success: true,
        data: {
          query,
          messageCount: messages.length,
          threadCount: threads.length,
          isComplete: response.c ?? true,
          messages: messages.map(m => ({
            id: m.mid,
            subject: m.subject,
            from: normalizeParticipant(m.from),
            snippet: m.snippet,
            timestamp: getTimestamp(m),
            unread: isUnread(m),
          })),
        },
        widgets,
      };
    } catch (error) {
      console.error('[MessageTools] searchEmails error:', error);
      return {
        success: false,
        error: `Failed to search emails: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };
}

// Register all message tools
export function registerMessageTools(
  registry: { register: (def: ToolDefinition, handler: ToolHandler) => void },
  provider: TitanMailProvider
): void {
  registry.register(fetchMessagesTool, createFetchMessagesHandler(provider));
  registry.register(fetchMessageSnippetTool, createFetchMessageSnippetHandler(provider));
  registry.register(fetchMessageBodyTool, createFetchMessageBodyHandler(provider));
  registry.register(titanSearchEmailsTool, createTitanSearchEmailsHandler(provider));
}
