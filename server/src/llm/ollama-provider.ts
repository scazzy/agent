/**
 * Ollama LLM Provider
 * Implementation of LLMService for Ollama
 */

import { LLMConfig, LLMMessage, LLMResponse, StreamChunk } from '../types/llm';
import { ToolDefinition } from '../types/tools';
import { LLMService } from './llm-service';

interface OllamaMessage {
  role: string;
  content: string;
}

interface OllamaStreamResponse {
  model: string;
  created_at: string;
  message?: {
    role: string;
    content: string;
  };
  done: boolean;
  done_reason?: string;
}

interface OllamaChatResponse {
  model: string;
  created_at: string;
  message?: {
    role: string;
    content: string;
  };
  done: boolean;
  done_reason?: string;
}

interface OllamaTagsResponse {
  models?: { name: string }[];
}

export class OllamaProvider extends LLMService {
  private baseUrl: string;

  constructor(config: LLMConfig) {
    super(config);
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
  }

  /**
   * Non-streaming chat completion
   */
  async chat(messages: LLMMessage[], _tools?: ToolDefinition[]): Promise<LLMResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        messages: this.formatMessages(messages),
        stream: false,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens,
        },
      }),
      signal: AbortSignal.timeout(this.config.timeout || 120000),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as OllamaChatResponse;

    return {
      content: data.message?.content || '',
      finishReason: data.done_reason === 'stop' ? 'stop' : 'stop',
    };
  }

  /**
   * Streaming chat completion
   */
  async *streamChat(
    messages: LLMMessage[],
    _tools?: ToolDefinition[]
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const controller = new AbortController();
    const timeout = this.config.timeout || 300000; // 5 minutes default for large models
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    console.log(`[Ollama] Starting stream request to model: ${this.config.model}`);
    console.log(`[Ollama] Timeout set to ${timeout / 1000}s`);

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          messages: this.formatMessages(messages),
          stream: true,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.maxTokens,
          },
        }),
        signal: controller.signal,
      });

      console.log(`[Ollama] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Ollama] API error: ${errorText}`);
        yield {
          type: 'error',
          error: `Ollama API error: ${response.status} ${response.statusText} - ${errorText}`,
        };
        return;
      }

      if (!response.body) {
        yield { type: 'error', error: 'No response body' };
        return;
      }

      console.log('[Ollama] Starting to read stream...');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      let chunkCount = 0;
      let totalContent = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log(`[Ollama] Stream complete. Total chunks: ${chunkCount}, Total content length: ${totalContent}`);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const chunk: OllamaStreamResponse = JSON.parse(line);
            chunkCount++;

            if (chunkCount === 1) {
              console.log('[Ollama] Received first chunk from model');
            }

            if (chunk.done) {
              console.log(`[Ollama] Model signaled done. Total chunks: ${chunkCount}`);
              yield { type: 'done' };
              return;
            }

            if (chunk.message?.content) {
              totalContent += chunk.message.content.length;
              yield {
                type: 'content',
                content: chunk.message.content,
              };
            }
          } catch (parseError) {
            console.error('Failed to parse Ollama stream chunk:', line, parseError);
          }
        }
      }

      // Handle any remaining content in buffer
      if (buffer.trim()) {
        try {
          const chunk: OllamaStreamResponse = JSON.parse(buffer);
          if (chunk.message?.content) {
            yield { type: 'content', content: chunk.message.content };
          }
          if (chunk.done) {
            yield { type: 'done' };
          }
        } catch {
          // Ignore incomplete final chunk
        }
      }

      yield { type: 'done' };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        yield { type: 'error', error: 'Request timeout' };
      } else {
        yield { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Check if Ollama is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return [];
      }

      const data = (await response.json()) as OllamaTagsResponse;
      return (data.models || []).map((m) => m.name);
    } catch {
      return [];
    }
  }

  /**
   * Format messages for Ollama API
   */
  private formatMessages(messages: LLMMessage[]): OllamaMessage[] {
    return messages.map(msg => ({
      role: msg.role === 'tool' ? 'assistant' : msg.role,
      content: msg.content,
    }));
  }
}
