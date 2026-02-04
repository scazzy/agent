/**
 * LLM Service Types
 * Defines interfaces for LLM configuration, messages, and streaming
 */

export interface LLMConfig {
  provider: 'ollama' | 'openai' | 'anthropic';
  model: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
}

export interface StreamChunk {
  type: 'content' | 'done' | 'error';
  content?: string;
  error?: string;
}

/**
 * Parsed response from LLM following our JSON output format
 */
export interface ParsedLLMResponse {
  thinking?: string;
  toolCalls?: ToolCall[];
  response: string;
  widgets?: WidgetDefinition[];
}

export interface WidgetDefinition {
  type: string;
  data: Record<string, unknown>;
  vdom?: VDOMNode;
}

export interface VDOMNode {
  component: string;
  props?: Record<string, unknown>;
  children?: (VDOMNode | string)[];
}

/**
 * Model-specific configuration
 */
export interface ModelConfig {
  model: string;
  contextWindow: number;
  supportsStreaming: boolean;
  systemPromptSupport: 'native' | 'prepend';
}
