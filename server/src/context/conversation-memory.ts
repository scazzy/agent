/**
 * Conversation Memory Manager
 * Manages conversation history with token/entry limits
 */

import { LLMMessage, ToolCall } from '../types/llm';
import { WidgetBlock } from '../types/protocol';

export interface ConversationEntry {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  widgets?: WidgetBlock[];
}

export interface ConversationMemory {
  id: string;
  entries: ConversationEntry[];
  metadata: {
    createdAt: Date;
    lastActivity: Date;
    messageCount: number;
  };
}

export interface ConversationManagerConfig {
  maxEntries: number;
  maxTokensEstimate: number;
  pruneStrategy: 'fifo' | 'summarize';
}

const defaultConfig: ConversationManagerConfig = {
  maxEntries: parseInt(process.env.MAX_HISTORY_ENTRIES || '50', 10),
  maxTokensEstimate: parseInt(process.env.MAX_CONTEXT_TOKENS || '4096', 10),
  pruneStrategy: 'fifo',
};

export class ConversationManager {
  private conversations: Map<string, ConversationMemory> = new Map();
  private config: ConversationManagerConfig;

  constructor(config: Partial<ConversationManagerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Get or create a conversation
   */
  getOrCreate(conversationId: string): ConversationMemory {
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, {
        id: conversationId,
        entries: [],
        metadata: {
          createdAt: new Date(),
          lastActivity: new Date(),
          messageCount: 0,
        },
      });
    }
    return this.conversations.get(conversationId)!;
  }

  /**
   * Add an entry to the conversation
   */
  addEntry(conversationId: string, entry: Omit<ConversationEntry, 'timestamp'>): void {
    const memory = this.getOrCreate(conversationId);

    memory.entries.push({
      ...entry,
      timestamp: new Date(),
    });

    memory.metadata.lastActivity = new Date();
    memory.metadata.messageCount++;

    this.pruneIfNeeded(memory);
  }

  /**
   * Add a user message
   */
  addUserMessage(conversationId: string, content: string): void {
    this.addEntry(conversationId, { role: 'user', content });
  }

  /**
   * Add an assistant message
   */
  addAssistantMessage(
    conversationId: string,
    content: string,
    options?: { toolCalls?: ToolCall[]; widgets?: WidgetBlock[] }
  ): void {
    this.addEntry(conversationId, {
      role: 'assistant',
      content,
      toolCalls: options?.toolCalls,
      widgets: options?.widgets,
    });
  }

  /**
   * Add a tool result
   */
  addToolResult(conversationId: string, toolCallId: string, content: string): void {
    this.addEntry(conversationId, {
      role: 'tool',
      content,
      toolCallId,
    });
  }

  /**
   * Get messages formatted for LLM
   */
  getMessages(conversationId: string): LLMMessage[] {
    const memory = this.getOrCreate(conversationId);

    return memory.entries.map(entry => ({
      role: entry.role,
      content: entry.content,
      ...(entry.toolCallId && { toolCallId: entry.toolCallId }),
    }));
  }

  /**
   * Get recent messages (last N)
   */
  getRecentMessages(conversationId: string, count: number): LLMMessage[] {
    const memory = this.getOrCreate(conversationId);
    const recent = memory.entries.slice(-count);

    return recent.map(entry => ({
      role: entry.role,
      content: entry.content,
      ...(entry.toolCallId && { toolCallId: entry.toolCallId }),
    }));
  }

  /**
   * Get conversation summary
   */
  getSummary(conversationId: string): string | null {
    const memory = this.conversations.get(conversationId);
    if (!memory || memory.entries.length === 0) {
      return null;
    }

    const userMessages = memory.entries
      .filter(e => e.role === 'user')
      .slice(-3)
      .map(e => e.content.substring(0, 100));

    return `Recent queries: ${userMessages.join('; ')}`;
  }

  /**
   * Clear a conversation
   */
  clear(conversationId: string): void {
    this.conversations.delete(conversationId);
  }

  /**
   * Clear all conversations
   */
  clearAll(): void {
    this.conversations.clear();
  }

  /**
   * Check if conversation exists
   */
  exists(conversationId: string): boolean {
    return this.conversations.has(conversationId);
  }

  /**
   * Get conversation count
   */
  getConversationCount(): number {
    return this.conversations.size;
  }

  /**
   * Prune old entries if needed
   */
  private pruneIfNeeded(memory: ConversationMemory): void {
    if (this.config.pruneStrategy === 'fifo') {
      // Remove oldest entries beyond max
      while (memory.entries.length > this.config.maxEntries) {
        memory.entries.shift();
      }
    }
    // TODO: Implement 'summarize' strategy for more intelligent pruning
  }

  /**
   * Estimate token count for a conversation
   * Rough estimate: ~4 characters per token
   */
  estimateTokenCount(conversationId: string): number {
    const memory = this.conversations.get(conversationId);
    if (!memory) return 0;

    const totalChars = memory.entries.reduce((sum, entry) => sum + entry.content.length, 0);
    return Math.ceil(totalChars / 4);
  }
}
