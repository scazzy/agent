/**
 * AI Agent Orchestrator
 * Main agent that coordinates LLM, tools, context, and widgets
 */

import { LLMConfig, LLMMessage, ToolCall, ParsedLLMResponse } from '../types/llm';
import { ChatRequest, WidgetBlock } from '../types/protocol';
import { ToolResult } from '../types/tools';
import { OllamaProvider } from '../llm/ollama-provider';
import { defaultConfig } from '../llm/config';
import { SystemPromptBuilder } from '../context/system-prompts';
import { ConversationManager } from '../context/conversation-memory';
import { UserContextProvider } from '../context/user-context';
import { ToolRegistry, ToolExecutor, registerEmailTools, registerCalendarTools } from '../tools';
import { EmailProvider } from '../providers/email-provider';
import { CalendarProvider } from '../providers/calendar-provider';
import { WidgetGenerator } from '../widgets/widget-generator';
import { StreamHelper } from '../utils/stream-helper';

export interface AgentConfig {
  llm?: Partial<LLMConfig>;
  maxToolIterations?: number;
  streamResponses?: boolean;
}

const DEFAULT_MAX_TOOL_ITERATIONS = 5;

export class Agent {
  private llmProvider: OllamaProvider;
  private conversationManager: ConversationManager;
  private systemPromptBuilder: SystemPromptBuilder;
  private userContextProvider: UserContextProvider;
  private toolRegistry: ToolRegistry;
  private toolExecutor: ToolExecutor;
  private widgetGenerator: WidgetGenerator;
  private config: AgentConfig;

  constructor(config: AgentConfig = {}) {
    this.config = config;

    // Initialize LLM
    const llmConfig = { ...defaultConfig, ...config.llm };
    this.llmProvider = new OllamaProvider(llmConfig);

    // Initialize context management
    this.conversationManager = new ConversationManager();
    this.systemPromptBuilder = new SystemPromptBuilder();

    // Initialize providers
    const emailProvider = new EmailProvider();
    const calendarProvider = new CalendarProvider();

    // Initialize user context
    this.userContextProvider = new UserContextProvider(emailProvider, calendarProvider);

    // Initialize tools
    this.toolRegistry = new ToolRegistry();
    this.toolExecutor = new ToolExecutor(this.toolRegistry);
    registerEmailTools(this.toolRegistry, emailProvider);
    registerCalendarTools(this.toolRegistry, calendarProvider);

    // Initialize widget generator
    this.widgetGenerator = new WidgetGenerator();

    console.log(`Agent initialized with model: ${llmConfig.model}`);
    console.log(`Registered tools: ${this.toolRegistry.getAllNames().join(', ')}`);
  }

  /**
   * Process a chat request
   */
  async processRequest(request: ChatRequest, streamHelper: StreamHelper): Promise<void> {
    const conversationId = request.conversationId || `conv-${Date.now()}`;
    const startTime = Date.now();

    try {
      // Get or add user message
      const lastMessage = request.messages[request.messages.length - 1];
      if (lastMessage.role === 'user') {
        this.conversationManager.addUserMessage(conversationId, lastMessage.content);
      }

      // Check LLM availability
      const isAvailable = await this.llmProvider.isAvailable();
      if (!isAvailable) {
        streamHelper.sendError('LLM service is not available. Please ensure Ollama is running.', 'LLM_UNAVAILABLE');
        return;
      }

      // Build context
      const userContext = await this.userContextProvider.buildContext();
      const systemPrompt = this.systemPromptBuilder.build(
        userContext as unknown as Record<string, unknown>,
        this.toolRegistry.getAllDefinitions()
      );

      // Get conversation history
      const history = this.conversationManager.getMessages(conversationId);

      // Build messages for LLM
      const messages: LLMMessage[] = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-10), // Last 10 messages for context
      ];

      // Process with tool loop
      await this.processWithToolLoop(messages, conversationId, streamHelper);

      const duration = Date.now() - startTime;
      console.log(`Request processed in ${duration}ms`);
    } catch (error) {
      console.error('Agent error:', error);
      streamHelper.sendError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        'AGENT_ERROR'
      );
    }
  }

  /**
   * Main processing loop with tool execution
   */
  private async processWithToolLoop(
    messages: LLMMessage[],
    conversationId: string,
    streamHelper: StreamHelper,
    iteration: number = 0
  ): Promise<void> {
    const maxIterations = this.config.maxToolIterations || DEFAULT_MAX_TOOL_ITERATIONS;

    if (iteration >= maxIterations) {
      streamHelper.sendTextDelta(
        'I apologize, but I encountered too many tool calls while processing your request. Please try rephrasing your question.'
      );
      streamHelper.sendDone();
      return;
    }

    console.log(`Processing iteration ${iteration + 1}/${maxIterations}`);

    // Send status to client
    if (iteration === 0) {
      streamHelper.sendStatus('Thinking...');
    } else {
      streamHelper.sendStatus('Processing tool results...');
    }

    // Get LLM response
    let fullResponse = '';

    for await (const chunk of this.llmProvider.streamChat(messages)) {
      if (chunk.type === 'content' && chunk.content) {
        fullResponse += chunk.content;
      } else if (chunk.type === 'error') {
        streamHelper.sendError(chunk.error || 'LLM error', 'LLM_ERROR');
        return;
      }
    }

    console.log('Raw LLM response:', fullResponse.substring(0, 500) + '...');

    // Parse the response
    const parsed = this.parseResponse(fullResponse);

    // If there are tool calls, execute them
    if (parsed.toolCalls && parsed.toolCalls.length > 0) {
      console.log(`Executing ${parsed.toolCalls.length} tool call(s)`);

      const toolResults = await this.toolExecutor.executeMany(parsed.toolCalls);

      // Collect widgets from tool results
      const toolWidgets = this.widgetGenerator.generateFromToolResults(toolResults);

      // Send tool widgets to client
      for (const widget of toolWidgets) {
        streamHelper.sendWidget(widget);
      }

      // Build tool result messages
      const toolMessages = this.buildToolResultMessages(parsed.toolCalls, toolResults);

      // Continue with tool results
      const newMessages = [
        ...messages,
        { role: 'assistant' as const, content: fullResponse },
        ...toolMessages,
      ];

      // Recursive call for next iteration
      await this.processWithToolLoop(newMessages, conversationId, streamHelper, iteration + 1);
      return;
    }

    // No tool calls - send final response
    const responseText = parsed.response || this.extractPlainText(fullResponse);

    // Stream the response text word by word
    await this.streamText(responseText, streamHelper);

    // Generate and send widgets from LLM response
    if (parsed.widgets && parsed.widgets.length > 0) {
      const llmWidgets = this.widgetGenerator.parseFromLLMResponse(parsed.widgets);
      for (const widget of llmWidgets) {
        streamHelper.sendWidget(widget);
      }
    }

    // Save assistant response to conversation memory
    this.conversationManager.addAssistantMessage(conversationId, responseText);

    streamHelper.sendDone();
  }

  /**
   * Parse LLM response (JSON or plain text)
   */
  private parseResponse(response: string): ParsedLLMResponse {
    // Try to extract JSON from the response
    let jsonContent = response;

    // Remove markdown code blocks if present
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonContent = codeBlockMatch[1].trim();
    }

    // Try to find JSON object
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);

        // Normalize tool_calls to toolCalls
        if (parsed.tool_calls && !parsed.toolCalls) {
          parsed.toolCalls = parsed.tool_calls.map((tc: { id?: string; name: string; arguments: Record<string, unknown> }) => ({
            id: tc.id || `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: tc.name,
            arguments: tc.arguments || {},
          }));
        }

        return {
          thinking: parsed.thinking,
          toolCalls: parsed.toolCalls,
          response: parsed.response || '',
          widgets: parsed.widgets,
        };
      } catch (parseError) {
        console.warn('Failed to parse JSON response:', parseError);
      }
    }

    // Fallback: treat entire response as plain text
    return {
      response: response.trim(),
    };
  }

  /**
   * Extract plain text from response (remove JSON artifacts)
   */
  private extractPlainText(response: string): string {
    // Remove code blocks
    let text = response.replace(/```[\s\S]*?```/g, '');

    // Remove JSON-like content
    text = text.replace(/\{[\s\S]*?\}/g, '');

    // Clean up whitespace
    text = text.trim();

    // If nothing left, return a default message
    if (!text) {
      return "I've processed your request.";
    }

    return text;
  }

  /**
   * Build messages from tool results
   */
  private buildToolResultMessages(
    toolCalls: ToolCall[],
    results: Map<string, ToolResult>
  ): LLMMessage[] {
    const messages: LLMMessage[] = [];

    for (const call of toolCalls) {
      const result = results.get(call.id);
      if (result) {
        messages.push({
          role: 'tool',
          content: JSON.stringify({
            tool: call.name,
            success: result.success,
            data: result.data,
            error: result.error,
          }),
          toolCallId: call.id,
        });
      }
    }

    return messages;
  }

  /**
   * Stream text word by word with slight delay
   */
  private async streamText(text: string, streamHelper: StreamHelper): Promise<void> {
    const words = text.split(/(\s+)/);

    for (const word of words) {
      streamHelper.sendTextDelta(word);
      // Small delay for streaming effect
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Check if LLM is available
   */
  async isAvailable(): Promise<boolean> {
    return this.llmProvider.isAvailable();
  }

  /**
   * Get agent status
   */
  getStatus(): { model: string; tools: string[]; conversationCount: number } {
    return {
      model: this.llmProvider.getModel(),
      tools: this.toolRegistry.getAllNames(),
      conversationCount: this.conversationManager.getConversationCount(),
    };
  }

  /**
   * Clear conversation history
   */
  clearConversation(conversationId: string): void {
    this.conversationManager.clear(conversationId);
  }

  /**
   * Clear all conversations
   */
  clearAllConversations(): void {
    this.conversationManager.clearAll();
  }
}
