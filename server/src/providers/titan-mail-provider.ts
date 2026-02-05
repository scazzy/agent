/**
 * Titan Mail Provider
 * Calls real Titan Mail APIs to fetch messages
 */

import { SessionInfo } from '../types/protocol';

// Staging base URL
const STAGING_BASE_URL = 'https://flockmail-backend.flock-staging.com/fa';

// ============================================================================
// Titan Mail API Types (based on official API docs)
// ============================================================================

// Participant in email
export interface Participant {
  email: string;
  name?: string;
  fn?: string;  // First name
  ln?: string;  // Last name
  bi?: number;  // BIMI ID
}

// File attachment info
export interface FileInfo {
  id: string;
  filename: string;
  disposition?: 'INLINE' | 'ATTACHMENT';
  content_type?: string;
  size?: number;
  encoding?: string;
}

// Message headers
export interface MessageHeaders {
  rmhi?: string;  // In reply to header
  mhid: string;   // Message header ID
  date?: number;  // Timestamp
  hashBody?: string;
}

// Full Message object from Titan API
export interface TitanMessage {
  mid: string;
  mhid?: string;
  id?: number;           // Message ID (from search)
  mailId?: number;       // Mail ID (from search)
  folder_id?: number;
  thread_id?: number;
  uid?: number;
  from: Participant | Participant[];
  reply_to?: Participant[];
  to?: Participant[];
  cc?: Participant[];
  bcc?: Participant[];
  subject: string;
  snippet?: string;
  createdAt?: number;    // Timestamp (from search)
  updatedAt?: number;    // Timestamp (from search)
  de?: boolean;          // Decode error
  files?: FileInfo[];
  t?: boolean;           // Tracked
  u?: boolean;           // Unread
  s?: boolean;           // Starred
  d?: boolean;           // Draft
  headers?: MessageHeaders;
  body?: string;
  rc?: number;           // Receipt count
  state?: number;        // Bitset: unread(0), star(1), draft(2), attachment(3), etc.
  lids?: number[];       // Label IDs
}

// Thread object
export interface TitanThread {
  tid: number;
  msg_count?: number;
  unique_msg_count?: number;
  unread_count?: number;
  star_count?: number;
  attachment_count?: number;
  draft_count?: number;
  u?: boolean;   // Unread
  s?: boolean;   // Starred
  a?: boolean;   // Has attachment
  d?: boolean;   // Draft
  subject: string;
  snippet?: string;
  tp?: {         // Thread participants
    from?: Participant[];
    to?: Participant[];
    bcc?: Participant[];
  };
  folder_ids?: number[];
  last_message_recieved_timestamp?: number;
  last_message_sent_timestamp?: number;
  state?: number;
  lids?: number[];
}

// Search request params
export interface SearchParams {
  from?: string[];      // Sender emails
  to?: string[];        // Receiver emails (to, cc, bcc)
  contact?: string[];   // Either sender or receiver
  in?: string;          // Folder name
  subject?: string[];   // Subject search
  words?: string;       // Full text search (REQUIRED)
  sf?: {                // Size filter
    comp: 'LT' | 'GT';
    size: number;
  };
  df?: {                // Date filter
    st?: string;        // Start date (yyyy-mm-dd)
    en?: string;        // End date
  };
  s?: boolean;          // Starred
  u?: boolean;          // Unread
  pt?: string;          // Page token for pagination
  ps?: number;          // Page size (default 200)
  type?: 't' | 'm';     // Thread or Message
  lid?: number;         // Label ID
  ha?: boolean;         // Has attachment
}

// Search response (API uses "m" for messages, "t" for threads)
export interface SearchResponse {
  t?: TitanThread[];    // Threads (when type='t')
  m?: TitanMessage[];   // Messages (when type='m')
  c?: boolean;          // Is complete (no more results)
  pt?: string;          // Page token for next page
  total?: number;
}

export interface FetchMessagesParams {
  folderId?: number;
  cursor?: number | null;
  limit?: number;
  folderType?: string;
  filterState?: number;
}

export interface FetchMessagesResponse {
  messages: TitanMessage[];
  cursor?: number;
}

export interface MessageSnippetResponse {
  msgSnippet: string;
}

export interface MessageBodyResponse {
  body: string;
  rc?: number;
}

// Folder info (API returns "id" not "folder_id")
export interface TitanFolder {
  id: number;
  name: string;
  type: string;
  sync_state?: string;
  unread_count?: number;
  p_uc?: number;
  tc?: number;
  star_count?: number;
  state?: number;
  flow?: string;
}

/**
 * Titan Mail Provider - fetches real email data
 */
export class TitanMailProvider {
  private baseUrl: string;
  private session: SessionInfo | null = null;
  private cursor: number | null = null;
  private folders: TitanFolder[] = [];
  private foldersLoaded: boolean = false;

  constructor(baseUrl: string = STAGING_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set session for authenticated requests
   */
  setSession(session: SessionInfo): void {
    this.session = session;
    // Use baseUrl from session if available
    if (session.baseUrl) {
      this.baseUrl = session.baseUrl;
    }
    // Reset folders cache when session changes
    this.folders = [];
    this.foldersLoaded = false;
  }

  /**
   * Fetch folders list
   * GET /folders
   */
  async fetchFolders(): Promise<TitanFolder[]> {
    if (this.foldersLoaded && this.folders.length > 0) {
      return this.folders;
    }

    try {
      const response = await this.request<{ folders: TitanFolder[] }>('/folders');
      this.folders = response.folders || [];
      this.foldersLoaded = true;
      console.log(`[TitanMail] Loaded ${this.folders.length} folders:`);
      this.folders.forEach(f => {
        console.log(`  - id=${f.id}, name="${f.name}", type="${f.type}"`);
      });
      return this.folders;
    } catch (error) {
      console.error('[TitanMail] Failed to fetch folders:', error);
      // Return empty array but don't mark as loaded so it can retry
      return [];
    }
  }

  /**
   * Get folder ID by type (INBOX, SENT, DRAFTS, etc.)
   * The API returns lowercase types like "inbox", "sent", "spam"
   */
  async getFolderIdByType(folderType: string): Promise<number | null> {
    const folders = await this.fetchFolders();
    const normalizedType = folderType.toLowerCase();
    
    // First try to match by type
    let folder = folders.find(f => f.type?.toLowerCase() === normalizedType);
    
    // If not found, try to match by name
    if (!folder) {
      folder = folders.find(f => f.name?.toLowerCase() === normalizedType);
    }
    
    if (folder) {
      console.log(`[TitanMail] Found folder: type="${folderType}" → id=${folder.id}`);
      return folder.id;
    }
    
    console.error(`[TitanMail] Folder not found for type: ${folderType}`);
    console.log(`[TitanMail] Available folders:`, folders.map(f => `${f.type}(${f.id})`).join(', '));
    return null;
  }

  /**
   * Get INBOX folder ID
   */
  async getInboxFolderId(): Promise<number | null> {
    return this.getFolderIdByType('inbox');
  }

  /**
   * Get current cursor for pagination
   */
  getCursor(): number | null {
    return this.cursor;
  }

  /**
   * Set cursor for pagination
   */
  setCursor(cursor: number | null): void {
    this.cursor = cursor;
  }

  /**
   * Make authenticated request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.session) {
      throw new Error('No session available. Please login first.');
    }

    const base = this.baseUrl.replace(/\/+$/, '');
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${base}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Session-Token': this.session.session,
      ...((options.headers as Record<string, string>) || {}),
    };

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[TitanMail API] ${options.method || 'GET'} ${url}`);
    console.log(`[TitanMail API] Session: ${this.session.session.substring(0, 20)}...`);
    if (options.body) {
      console.log(`[TitanMail API] Body: ${options.body}`);
    }
    console.log(`${'='.repeat(60)}\n`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`[TitanMail API] Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TitanMail API] Error Response: ${errorText}`);
      throw new Error(`Titan Mail API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[TitanMail API] Response Data:`, JSON.stringify(data, null, 2).substring(0, 500) + '...');
    
    return data as T;
  }

  /**
   * Fetch messages from a folder
   * GET /messages
   */
  async fetchMessages(params: FetchMessagesParams = {}): Promise<FetchMessagesResponse> {
    const {
      folderId,
      cursor = this.cursor,
      limit = 20,
      folderType = 'INBOX',
      filterState,
    } = params;

    // Get folder ID - either use provided one or look it up
    let actualFolderId: number | undefined = folderId;
    if (actualFolderId === undefined || actualFolderId === null) {
      const resolved = await this.getFolderIdByType(folderType);
      if (resolved === null) {
        console.error(`[TitanMail] Could not find folder ID for type: ${folderType}`);
        throw new Error(`Folder not found: ${folderType}`);
      }
      actualFolderId = resolved;
      console.log(`[TitanMail] Resolved folder ${folderType} to ID: ${actualFolderId}`);
    }

    const queryParams = new URLSearchParams({
      folder_id: actualFolderId.toString(),
      folder_type: folderType,
      limit: limit.toString(),
    });

    if (cursor !== null && cursor !== undefined) {
      queryParams.set('cursor', cursor.toString());
    }

    if (filterState !== undefined) {
      queryParams.set('I', filterState.toString());
    }

    const response = await this.request<{ messages: TitanMessage[]; cursor?: number }>(
      `/messages?${queryParams.toString()}`
    );

    // Update cursor for next fetch
    if (response.cursor) {
      this.cursor = response.cursor;
    }

    return {
      messages: response.messages || [],
      cursor: response.cursor,
    };
  }

  /**
   * Fetch new/latest messages (using cursor)
   */
  async fetchNewMessages(limit: number = 10): Promise<TitanMessage[]> {
    const response = await this.fetchMessages({
      cursor: this.cursor,
      limit,
    });
    return response.messages;
  }

  /**
   * Fetch message body snippet
   * GET /message/body/snippet
   */
  async fetchMessageSnippet(mid: string, length: number = 1000): Promise<string> {
    const queryParams = new URLSearchParams({
      mid,
      len: Math.min(length, 5000).toString(),
    });

    const response = await this.request<MessageSnippetResponse>(
      `/message/body/snippet?${queryParams.toString()}`
    );

    return response.msgSnippet;
  }

  /**
   * Fetch full message body
   * GET /v2/messages/body
   */
  async fetchMessageBody(mid: string, mhid: string, getReadCount: boolean = false): Promise<MessageBodyResponse> {
    const queryParams = new URLSearchParams({
      mid,
      mhid,
      grc: getReadCount.toString(),
    });

    return this.request<MessageBodyResponse>(
      `/v2/messages/body?${queryParams.toString()}`
    );
  }

  /**
   * Search emails
   * POST /search
   */
  async searchEmails(params: SearchParams): Promise<SearchResponse> {
    // Build search request body
    const body: Record<string, unknown> = {};

    if (params.from && params.from.length > 0) {
      body.from = params.from;
    }
    if (params.to && params.to.length > 0) {
      body.to = params.to;
    }
    if (params.contact && params.contact.length > 0) {
      body.contact = params.contact;
    }
    if (params.in) {
      body.in = params.in;
    }
    if (params.subject && params.subject.length > 0) {
      body.subject = params.subject;
    }
    if (params.words) {
      body.words = params.words;
    }
    if (params.sf) {
      body.sf = params.sf;
    }
    if (params.df) {
      body.df = params.df;
    }
    if (params.s !== undefined) {
      body.s = params.s;
    }
    if (params.u !== undefined) {
      body.u = params.u;
    }
    if (params.pt) {
      body.pt = params.pt;
    }
    if (params.ps) {
      body.ps = params.ps;
    }
    if (params.type) {
      body.type = params.type;
    }
    if (params.lid !== undefined) {
      body.lid = params.lid;
    }
    if (params.ha !== undefined) {
      body.ha = params.ha;
    }

    return this.request<SearchResponse>('/search', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Check if session is available
   */
  hasSession(): boolean {
    return this.session !== null;
  }
}

// Export singleton instance
export const titanMailProvider = new TitanMailProvider();
