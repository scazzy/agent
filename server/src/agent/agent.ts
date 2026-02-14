/**
 * AI Agent Orchestrator
 * Main agent that coordinates LLM, tools, context, and widgets
 */

import { LLMConfig, LLMMessage, ToolCall, ParsedLLMResponse } from '../types/llm';
import { ChatRequest, WidgetBlock, SessionInfo } from '../types/protocol';
import { ToolResult } from '../types/tools';
import { OllamaProvider } from '../llm/ollama-provider';
import { defaultConfig } from '../llm/config';
import { PromptRouter } from '../context/prompts';
import { ConversationManager } from '../context/conversation-memory';
import { UserContextProvider } from '../context/user-context';
import { ToolRegistry, ToolExecutor, registerMessageTools, registerTitanCalendarTools } from '../tools';
import { EmailProvider } from '../providers/email-provider';
import { TitanMailProvider } from '../providers/titan-mail-provider';
import { TitanCalendarProvider } from '../providers/titan-calendar-provider';
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
  private promptRouter: PromptRouter;
  private userContextProvider: UserContextProvider;
  private toolRegistry: ToolRegistry;
  private toolExecutor: ToolExecutor;
  private widgetGenerator: WidgetGenerator;
  private titanMailProvider: TitanMailProvider;
  private titanCalendarProvider: TitanCalendarProvider;
  private config: AgentConfig;

  constructor(config: AgentConfig = {}) {
    this.config = config;

    // Initialize LLM
    const llmConfig = { ...defaultConfig, ...config.llm };
    this.llmProvider = new OllamaProvider(llmConfig);

    // Initialize context management
    this.conversationManager = new ConversationManager();
    this.promptRouter = new PromptRouter();

    // Initialize providers
    const emailProvider = new EmailProvider();
    this.titanMailProvider = new TitanMailProvider();
    this.titanCalendarProvider = new TitanCalendarProvider();

    // Initialize user context (uses mock providers for now - TODO: migrate to Titan providers)
    this.userContextProvider = new UserContextProvider(emailProvider);

    // Initialize tools
    this.toolRegistry = new ToolRegistry();
    this.toolExecutor = new ToolExecutor(this.toolRegistry);
    registerMessageTools(this.toolRegistry, this.titanMailProvider);
    registerTitanCalendarTools(this.toolRegistry, this.titanCalendarProvider);

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
      // Set session for Titan providers if available
      if (request.sessionInfo) {
        this.titanMailProvider.setSession(request.sessionInfo);
        this.titanCalendarProvider.setSession(request.sessionInfo);
        console.log(`[Agent] Session set for Titan Mail & Calendar API calls`);
        console.log(`[Agent] Session token: ${request.sessionInfo.session.substring(0, 30)}...`);
        console.log(`[Agent] Base URL: ${request.sessionInfo.baseUrl || 'default'}`);
      } else {
        console.warn('[Agent] WARNING: No sessionInfo in request - Titan API calls will fail!');
      }

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

      // Detect intent domains and filter tools accordingly
      const userQuery = lastMessage?.content || '';
      const domains = this.promptRouter.detectDomains(userQuery);
      const relevantTools = this.toolRegistry.getDefinitionsByDomain(domains);

      console.log(`[Agent] Detected domains: [${domains.join(', ')}], relevant tools: [${relevantTools.map(t => t.name).join(', ')}]`);

      // Build modular system prompt with only relevant domain prompts and tools
      const systemPrompt = this.promptRouter.assemble({
        query: userQuery,
        tools: relevantTools,
        userContext: userContext ? JSON.stringify(userContext) : undefined,
      });

      // Get conversation history - but only include if query needs context
      const history = this.conversationManager.getMessages(conversationId);
      const needsContext = this.queryNeedsContext(userQuery);
      
      console.log(`[Agent] Query needs context: ${needsContext} (query: "${userQuery.substring(0, 50)}")`);

      // Build messages for LLM
      const messages: LLMMessage[] = [
        { role: 'system', content: systemPrompt },
        ...(needsContext ? history.slice(-10) : [history[history.length - 1]].filter(Boolean)), // Only current message if no context needed
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
      console.log(`\n${'='.repeat(60)}`);
      console.log(`[Agent] Executing ${parsed.toolCalls.length} tool call(s):`);
      for (const tc of parsed.toolCalls) {
        console.log(`  - Tool: ${tc.name}`);
        console.log(`    Args: ${JSON.stringify(tc.arguments)}`);
      }
      console.log(`${'='.repeat(60)}\n`);

      const toolResults = await this.toolExecutor.executeMany(parsed.toolCalls);

      // Log tool results
      console.log(`\n[Agent] Tool Results:`);
      for (const [id, result] of toolResults) {
        console.log(`  - ${id}: success=${result.success}`);
        if (result.error) console.log(`    Error: ${result.error}`);
        if (result.data) console.log(`    Data keys: ${Object.keys(result.data).join(', ')}`);
        if (result.widgets) console.log(`    Widgets: ${result.widgets.length}`);
      }

      // Collect widgets from tool results
      const toolWidgets = this.widgetGenerator.generateFromToolResults(toolResults);
      console.log(`[Agent] Generated ${toolWidgets.length} widgets from tool results`);

      // Check if this is a summary request - don't send widgets for summaries
      const originalQuery = messages.find(m => m.role === 'user')?.content?.toLowerCase() || '';
      const isSummaryRequest = this.isSummaryQuery(originalQuery);
      
      if (isSummaryRequest) {
        console.log(`[Agent] Summary request detected - suppressing ${toolWidgets.length} widgets`);
      } else {
        // Send tool widgets to client (only for non-summary requests)
        for (const widget of toolWidgets) {
          streamHelper.sendWidget(widget);
        }
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
    // Handle both string and object response formats from LLM
    let responseText: string;
    if (typeof parsed.response === 'string') {
      responseText = parsed.response;
    } else if (typeof parsed.response === 'object' && parsed.response !== null) {
      // LLM returned structured response - extract summary or text field
      const respObj = parsed.response as Record<string, unknown>;
      responseText = (respObj.summary as string) || 
                     (respObj.text as string) || 
                     (respObj.message as string) ||
                     this.extractPlainText(fullResponse);
      console.log('[Agent] Extracted response from object, length:', responseText.length);
    } else {
      responseText = this.extractPlainText(fullResponse);
    }

    // Fallback: if response is empty after tool calls (iteration > 0), provide a default
    if (!responseText || !responseText.trim() && iteration > 0) {
      console.log('[Agent] Empty response after tool calls, using fallback');
      responseText = "I've completed the search but couldn't find any matching results. Try a different search term or check your filters.";
    }

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
    console.log('[Agent] Parsing response, length:', response.length);
    
    // Try to extract JSON from the response
    let jsonContent = response;

    // Remove markdown code blocks if present
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonContent = codeBlockMatch[1].trim();
      console.log('[Agent] Extracted from code block');
    }

    // Try to find JSON object
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      console.log('[Agent] Found JSON object, attempting to parse...');
      
      // Try parsing directly first
      let parsed: Record<string, unknown> | null = null;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        // If direct parse fails, try fixing common issues
        console.log('[Agent] Direct parse failed, attempting to fix JSON...');
        try {
          let fixedJson = jsonMatch[0];
          
          // Fix 1: Remove trailing commas before } or ]
          fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
          
          // Fix 2: Escape newlines that appear inside JSON string values
          fixedJson = fixedJson.replace(/"([^"\\]|\\.)*"/g, (match) => {
            return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
          });
          
          parsed = JSON.parse(fixedJson);
          console.log('[Agent] Fixed JSON parsed successfully');
        } catch (fixError) {
          console.error('[Agent] Failed to parse even after fixing:', fixError);
          console.error('[Agent] JSON content that failed:', jsonMatch[0].substring(0, 500));
        }
      }
      
      if (parsed) {
        console.log('[Agent] JSON parsed successfully!');
        console.log('[Agent] Has response:', !!parsed.response);
        console.log('[Agent] Has tool_calls:', !!parsed.tool_calls);
        console.log('[Agent] Has widgets:', !!parsed.widgets);

        // Normalize tool_calls to toolCalls
        if (parsed.tool_calls && !parsed.toolCalls) {
          parsed.toolCalls = (parsed.tool_calls as Array<{ id?: string; name: string; arguments: Record<string, unknown> }>).map((tc) => ({
            id: tc.id || `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: tc.name,
            arguments: tc.arguments || {},
          }));
        }

        const result = {
          thinking: parsed.thinking as string | undefined,
          toolCalls: parsed.toolCalls as ParsedLLMResponse['toolCalls'],
          response: (parsed.response as string) || '',
          widgets: parsed.widgets as ParsedLLMResponse['widgets'],
        };
        
        console.log('[Agent] Parsed result - response length:', result.response?.length);
        return result;
      }
    } else {
      console.log('[Agent] No JSON object found in response');
    }

    // Fallback: treat entire response as plain text
    console.log('[Agent] Falling back to plain text response');
    return {
      response: response.trim(),
    };
  }

  /**
   * Extract plain text from response (remove JSON artifacts)
   */
  private extractPlainText(response: string): string {
    // First, try to extract the "response" field value using regex (fallback for malformed JSON)
    // Use [\s\S] instead of . to match newlines
    const responseFieldMatch = response.match(/"response"\s*:\s*"((?:[^"\\]|\\[\s\S])*)"/);
    if (responseFieldMatch) {
      // Unescape the extracted string
      let extracted = responseFieldMatch[1];
      extracted = extracted.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      console.log('[Agent] Extracted response field via regex, length:', extracted.length);
      return extracted;
    }
    
    // Alternative: try to find response field with multiline content (unescaped newlines)
    // Match from "response": " until ", "widgets" or end of JSON
    const altMatch = response.match(/"response"\s*:\s*"([\s\S]*?)"\s*,\s*"widgets"/);
    if (altMatch) {
      let extracted = altMatch[1];
      extracted = extracted.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      console.log('[Agent] Extracted response field via alt regex, length:', extracted.length);
      return extracted;
    }

    // Remove code blocks
    let text = response.replace(/```[\s\S]*?```/g, '');

    // Remove full JSON objects (greedy match for nested objects)
    // Match from first { to last }
    text = text.replace(/\{[\s\S]*\}/g, '');

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
    // Build a single user message with all tool results
    // This format works better with models that don't have native tool support
    const resultSummaries: string[] = [];

    for (const call of toolCalls) {
      const result = results.get(call.id);
      if (result) {
        if (result.success) {
          const dataStr = result.data ? JSON.stringify(result.data, null, 2) : 'No data';
          resultSummaries.push(`Tool "${call.name}" returned:\n${dataStr}`);
        } else {
          resultSummaries.push(`Tool "${call.name}" failed: ${result.error}`);
        }
      }
    }

    const content = `TOOL RESULTS:\n${resultSummaries.join('\n\n')}\n\nBased on these results, provide a helpful response to the user. If no results were found, tell the user clearly.`;

    return [{
      role: 'user' as const,
      content,
    }];
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
   * Check if query is asking for a summary (text-only response, no widgets)
   */
  private isSummaryQuery(query: string): boolean {
    const summaryKeywords = [
      'summary', 'summarize', 'summarise', 'sum up',
      'brief', 'briefly', 'overview', 'recap',
      'catch me up', 'quick look', 'highlights',
      'what\'s important', 'key points', 'tldr', 'tl;dr',
      'in short', 'gist',
    ];
    
    return summaryKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Determine if a query needs conversation history for context
   * Fresh/standalone queries don't need history, follow-up queries do
   */
  private queryNeedsContext(query: string): boolean {
    const lowerQuery = query.toLowerCase().trim();
    
    // Short queries that are likely follow-ups
    if (lowerQuery.length < 15) {
      // Check if it's a standalone short command
      const standaloneShortQueries = [
        'find invoice', 'show emails', 'my inbox', 'any emails',
        'show calendar', 'my meetings', 'any meetings',
      ];
      if (standaloneShortQueries.some(sq => lowerQuery.includes(sq))) {
        return false;
      }
    }
    
    // Pronouns and references that indicate follow-up
    const contextIndicators = [
      // Pronouns referring to previous items
      'it', 'its', 'that', 'this', 'those', 'them', 'these',
      'he', 'she', 'they', 'his', 'her', 'their',
      // References to previous context
      'the same', 'same one', 'again', 'more of', 'another one',
      'previous', 'earlier', 'before', 'last one', 'first one',
      'second one', 'third one', 'which one', 'the one',
      // Follow-up phrases
      'what about', 'how about', 'and the', 'also',
      'tell me more', 'more details', 'expand on',
      // Short confirmations (need context)
      'yes', 'no', 'ok', 'sure', 'please', 'thanks',
    ];
    
    // Check if query contains context indicators
    const hasContextIndicator = contextIndicators.some(indicator => {
      // Word boundary check to avoid false positives like "another" matching "an"
      const regex = new RegExp(`\\b${indicator}\\b`, 'i');
      return regex.test(lowerQuery);
    });
    
    if (hasContextIndicator) {
      return true;
    }
    
    // Queries starting with action verbs are usually standalone
    const standaloneStarters = [
      'find', 'search', 'show', 'get', 'fetch', 'list',
      'summarize', 'give me', 'check', 'look for',
      'what is', 'what are', 'how many', 'when is',
    ];
    
    const startsWithStandalone = standaloneStarters.some(starter => 
      lowerQuery.startsWith(starter)
    );
    
    // If starts with action verb and no context indicators, it's standalone
    if (startsWithStandalone && !hasContextIndicator) {
      return false;
    }
    
    // Default: include context for safety
    return true;
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
