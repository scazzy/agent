/**
 * Tool Registry
 * Central registry for tool definitions and handlers.
 * Supports domain-based filtering for intent-driven tool selection.
 */

import { ToolDefinition, ToolModel, ToolDomain, ToolHandler, RegisteredTool } from '../types/tools';

export class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();

  /**
   * Register a tool with its handler.
   * Accepts both ToolDefinition and ToolModel (enhanced).
   */
  register(definition: ToolDefinition | ToolModel, handler: ToolHandler): void {
    if (this.tools.has(definition.name)) {
      console.warn(`Tool "${definition.name}" is being overwritten`);
    }

    this.tools.set(definition.name, { definition, handler });
  }

  /**
   * Get a registered tool
   */
  get(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Check if a tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get all tool definitions (for LLM context)
   */
  getAllDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.definition);
  }

  /**
   * Get tool definitions filtered by domain(s).
   * Tools without a domain (plain ToolDefinition) are always included.
   */
  getDefinitionsByDomain(domains: (ToolDomain | 'general')[]): ToolDefinition[] {
    return Array.from(this.tools.values())
      .filter(t => {
        const def = t.definition;
        if ('domain' in def) {
          return domains.includes((def as ToolModel).domain);
        }
        // Plain ToolDefinition without domain - always include
        return true;
      })
      .map(t => t.definition);
  }

  /**
   * Get all tool names
   */
  getAllNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Unregister a tool
   */
  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * Clear all tools
   */
  clear(): void {
    this.tools.clear();
  }

  /**
   * Get tool count
   */
  get size(): number {
    return this.tools.size;
  }
}
