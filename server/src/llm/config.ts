/**
 * LLM Configuration
 * Centralized configuration for LLM providers and models
 */

import { LLMConfig, ModelConfig } from '../types/llm';

export const defaultConfig: LLMConfig = {
  provider: 'ollama',
  model: process.env.LLM_MODEL || 'qwen2.5:7b',
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
  maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4096', 10),
  // Large models (20B+) need longer timeouts - default 5 minutes
  timeout: parseInt(process.env.LLM_TIMEOUT || '300000', 10),
};

export const modelRegistry: Record<string, ModelConfig> = {
  'gpt-oss:20b': {
    model: 'gpt-oss:20b',
    contextWindow: 8192,
    supportsStreaming: true,
    systemPromptSupport: 'native',
  },
  'llama3:8b': {
    model: 'llama3:8b',
    contextWindow: 8192,
    supportsStreaming: true,
    systemPromptSupport: 'native',
  },
  'llama3:70b': {
    model: 'llama3:70b',
    contextWindow: 8192,
    supportsStreaming: true,
    systemPromptSupport: 'native',
  },
  'mistral:7b': {
    model: 'mistral:7b',
    contextWindow: 8192,
    supportsStreaming: true,
    systemPromptSupport: 'native',
  },
  'mixtral:8x7b': {
    model: 'mixtral:8x7b',
    contextWindow: 32768,
    supportsStreaming: true,
    systemPromptSupport: 'native',
  },
  'qwen2:7b': {
    model: 'qwen2:7b',
    contextWindow: 32768,
    supportsStreaming: true,
    systemPromptSupport: 'native',
  },
};

export function getModelConfig(model: string): ModelConfig {
  return modelRegistry[model] || {
    model,
    contextWindow: 4096,
    supportsStreaming: true,
    systemPromptSupport: 'native',
  };
}

export function createConfig(overrides: Partial<LLMConfig> = {}): LLMConfig {
  return {
    ...defaultConfig,
    ...overrides,
  };
}
