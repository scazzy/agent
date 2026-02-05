/**
 * Tool System Types
 * Defines interfaces for tool definitions, parameters, and execution results.
 *
 * ToolDefinition: Base definition (name, description, parameters)
 * ToolModel: Enhanced definition with action type, usage hints, and domain
 */

import { WidgetBlock } from './protocol';

// ============================================================================
// Parameter Schema
// ============================================================================

export interface ParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  items?: ParameterSchema;
  default?: unknown;
}

// ============================================================================
// Tool Definition (base - what LLM sees)
// ============================================================================

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ParameterSchema>;
    required?: string[];
  };
}

// ============================================================================
// Tool Action Types
// ============================================================================

/** Tool calls a REST API */
export interface ApiToolAction {
  type: 'api';
  apiName: string;
}

/** Tool instructs client to perform an action (open search, open composer, etc.) */
export interface ClientToolAction {
  type: 'client';
  command: string;
  payload?: Record<string, unknown>;
}

/** Tool chains multiple other tools */
export interface CompositeToolAction {
  type: 'composite';
  tools: string[];
}

/** Tool performs internal logic only */
export interface InternalToolAction {
  type: 'internal';
}

export type ToolAction =
  | ApiToolAction
  | ClientToolAction
  | CompositeToolAction
  | InternalToolAction;

// ============================================================================
// Tool Usage Hints (helps LLM decide when to use a tool)
// ============================================================================

export interface ToolUsage {
  /** When to use this tool (natural language descriptions) */
  when: string[];
  /** When NOT to use this tool */
  notWhen?: string[];
  /** Prerequisites (e.g., "Requires authentication") */
  prerequisites?: string[];
  /** Expected output format */
  outputFormat: 'text' | 'widget' | 'both';
}

// ============================================================================
// Tool Domain
// ============================================================================

export type ToolDomain = 'email' | 'calendar' | 'general';

// ============================================================================
// Tool Model (enhanced definition with action, usage, domain)
// ============================================================================

export interface ToolModel extends ToolDefinition {
  /** What this tool does when executed */
  action: ToolAction;
  /** Usage guidance for the LLM */
  usage: ToolUsage;
  /** Product domain this tool belongs to */
  domain: ToolDomain;
}

// ============================================================================
// Tool Execution
// ============================================================================

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  widgets?: WidgetBlock[];
}

export type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>;

export interface RegisteredTool {
  definition: ToolDefinition;
  handler: ToolHandler;
}
