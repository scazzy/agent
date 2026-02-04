/**
 * Tool Executor
 * Executes tools and handles results
 */

import { ToolCall } from '../types/llm';
import { ToolResult } from '../types/tools';
import { ToolRegistry } from './tool-registry';

export class ToolExecutor {
  private registry: ToolRegistry;

  constructor(registry: ToolRegistry) {
    this.registry = registry;
  }

  /**
   * Execute a single tool call
   */
  async execute(toolCall: ToolCall): Promise<ToolResult> {
    const tool = this.registry.get(toolCall.name);

    if (!tool) {
      return {
        success: false,
        error: `Unknown tool: ${toolCall.name}. Available tools: ${this.registry.getAllNames().join(', ')}`,
      };
    }

    try {
      console.log(`Executing tool: ${toolCall.name}`, toolCall.arguments);
      const result = await tool.handler(toolCall.arguments);
      console.log(`Tool ${toolCall.name} completed:`, result.success ? 'success' : 'failed');
      return result;
    } catch (error) {
      console.error(`Tool ${toolCall.name} threw error:`, error);
      return {
        success: false,
        error: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Execute multiple tool calls in parallel
   */
  async executeMany(toolCalls: ToolCall[]): Promise<Map<string, ToolResult>> {
    const results = new Map<string, ToolResult>();

    await Promise.all(
      toolCalls.map(async call => {
        const result = await this.execute(call);
        results.set(call.id, result);
      })
    );

    return results;
  }

  /**
   * Execute tool calls sequentially
   */
  async executeSequential(toolCalls: ToolCall[]): Promise<Map<string, ToolResult>> {
    const results = new Map<string, ToolResult>();

    for (const call of toolCalls) {
      const result = await this.execute(call);
      results.set(call.id, result);
    }

    return results;
  }

  /**
   * Validate tool call arguments against definition
   */
  validateArguments(toolCall: ToolCall): { valid: boolean; errors: string[] } {
    const tool = this.registry.get(toolCall.name);

    if (!tool) {
      return { valid: false, errors: [`Unknown tool: ${toolCall.name}`] };
    }

    const errors: string[] = [];
    const { parameters } = tool.definition;

    // Check required parameters
    if (parameters.required) {
      for (const required of parameters.required) {
        if (toolCall.arguments[required] === undefined) {
          errors.push(`Missing required parameter: ${required}`);
        }
      }
    }

    // Check parameter types (basic validation)
    for (const [name, value] of Object.entries(toolCall.arguments)) {
      const schema = parameters.properties[name];
      if (!schema) {
        // Allow unknown parameters (flexible)
        continue;
      }

      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (schema.type !== actualType && value !== null && value !== undefined) {
        // Allow null/undefined for optional params
        if (parameters.required?.includes(name)) {
          errors.push(`Parameter "${name}" should be ${schema.type}, got ${actualType}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
