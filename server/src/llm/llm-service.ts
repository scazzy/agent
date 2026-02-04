/**
 * Abstract LLM Service
 * Base interface for LLM providers
 */

import { LLMConfig, LLMMessage, LLMResponse, StreamChunk } from '../types/llm';
import { ToolDefinition } from '../types/tools';

export abstract class LLMService {
  protected config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  /**
   * Send a chat completion request (non-streaming)
   */
  abstract chat(messages: LLMMessage[], tools?: ToolDefinition[]): Promise<LLMResponse>;

  /**
   * Send a streaming chat completion request
   */
  abstract streamChat(
    messages: LLMMessage[],
    tools?: ToolDefinition[]
  ): AsyncGenerator<StreamChunk, void, unknown>;

  /**
   * Check if the LLM service is available
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Get the current model name
   */
  getModel(): string {
    return this.config.model;
  }

  /**
   * Get the current configuration
   */
  getConfig(): LLMConfig {
    return { ...this.config };
  }
}
