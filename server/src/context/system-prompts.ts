/**
 * System Prompt Builder
 * Thin wrapper around PromptRouter for backwards compatibility.
 *
 * New code should import PromptRouter directly from './prompts'.
 */

import { ToolDefinition } from '../types/tools';
import { PromptRouter, getPromptStats } from './prompts';

export { getPromptStats };

export class SystemPromptBuilder {
  private router: PromptRouter;

  constructor() {
    this.router = new PromptRouter();
  }

  /**
   * Build a modular prompt based on query analysis.
   * Delegates to PromptRouter.assemble().
   */
  buildModular(
    query: string,
    tools: ToolDefinition[],
    userContext?: Record<string, unknown>
  ): string {
    return this.router.assemble({
      query,
      tools,
      userContext: userContext ? JSON.stringify(userContext) : undefined,
    });
  }
}
