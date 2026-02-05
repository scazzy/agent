/**
 * Prompt Router
 * Assembles system prompts from modular pieces based on detected intent.
 *
 * Assembly order:
 * 1. Always: persona + guardrails
 * 2. Per-domain: email and/or calendar instructions
 * 3. If widget keywords: widget capability guide
 * 4. Always: response-format (closest to LLM output)
 * 5. Tools section (only domain-relevant tools)
 * 6. User context (if available)
 */

import { ToolDefinition, ToolDomain, ToolModel } from '../../types/tools';

// Base prompts (always loaded)
import { personaPrompt } from './base/persona';
import { guardrailsPrompt } from './base/guardrails';
import { responseFormatPrompt } from './base/response-format';

// Domain prompts (loaded based on intent)
import { emailDomainPrompt } from './domains/email';
import { calendarDomainPrompt } from './domains/calendar';
import { generalDomainPrompt } from './domains/general';

// Capability prompts (loaded when needed)
import { widgetCapabilityPrompt } from './capabilities/widgets';

// ============================================================================
// Types
// ============================================================================

export type PromptDomain = ToolDomain | 'general';

interface DomainPromptDef {
  domain: string;
  keywords: string[];
  instructions: string;
}

interface CapabilityPromptDef {
  capability: string;
  keywords: string[];
  instructions: string;
}

export interface PromptAssemblyConfig {
  query: string;
  tools: ToolDefinition[];
  userContext?: string;
}

// ============================================================================
// Domain & Capability Registries
// ============================================================================

const domainPrompts: DomainPromptDef[] = [
  emailDomainPrompt,
  calendarDomainPrompt,
  generalDomainPrompt,
];

const capabilityPrompts: CapabilityPromptDef[] = [
  widgetCapabilityPrompt,
];

// ============================================================================
// Prompt Router
// ============================================================================

export class PromptRouter {
  /**
   * Detect which domains a query belongs to (keyword-based, fast).
   */
  detectDomains(query: string): PromptDomain[] {
    const lowerQuery = query.toLowerCase();
    const detected: PromptDomain[] = [];

    for (const dp of domainPrompts) {
      if (dp.keywords.length === 0) continue; // Skip general (fallback)
      const hasKeyword = dp.keywords.some(kw => lowerQuery.includes(kw.toLowerCase()));
      if (hasKeyword) {
        detected.push(dp.domain as PromptDomain);
      }
    }

    return detected.length > 0 ? detected : ['general'];
  }

  /**
   * Detect which capabilities are needed for a query.
   */
  detectCapabilities(query: string): string[] {
    const lowerQuery = query.toLowerCase();
    const detected: string[] = [];

    for (const cp of capabilityPrompts) {
      const hasKeyword = cp.keywords.some(kw => lowerQuery.includes(kw.toLowerCase()));
      if (hasKeyword) {
        detected.push(cp.capability);
      }
    }

    return detected;
  }

  /**
   * Filter tools to only those in detected domains.
   * Tools without a domain field (plain ToolDefinition) are always included.
   */
  getRelevantTools(allTools: (ToolDefinition | ToolModel)[], domains: PromptDomain[]): ToolDefinition[] {
    return allTools.filter(tool => {
      if ('domain' in tool) {
        return domains.includes((tool as ToolModel).domain);
      }
      // Plain ToolDefinition without domain - always include
      return true;
    });
  }

  /**
   * Assemble the full system prompt from modular pieces.
   */
  assemble(config: PromptAssemblyConfig): string {
    const { query, tools, userContext } = config;

    const domains = this.detectDomains(query);
    const capabilities = this.detectCapabilities(query);

    const parts: string[] = [];

    // 1. Always: persona
    parts.push(`# AI Assistant System Prompt\n`);
    parts.push(`## ${personaPrompt.section}\n${personaPrompt.content}\n`);

    // 2. Always: guardrails
    parts.push(`## ${guardrailsPrompt.section}\n${guardrailsPrompt.content}\n`);

    // 3. Domain-specific instructions
    for (const domain of domains) {
      const dp = domainPrompts.find(d => d.domain === domain);
      if (dp && dp.instructions) {
        const label = domain.charAt(0).toUpperCase() + domain.slice(1);
        parts.push(`## ${label} Instructions\n${dp.instructions}\n`);
      }
    }

    // 4. Capability prompts (e.g., widget creation guide)
    for (const cap of capabilities) {
      const cp = capabilityPrompts.find(c => c.capability === cap);
      if (cp) {
        parts.push(`## ${cap.charAt(0).toUpperCase() + cap.slice(1)} Guide\n${cp.instructions}\n`);
      }
    }

    // 5. Tools section
    parts.push(`## Available Tools\n${this.formatTools(tools)}\n`);

    // 6. Response format (last before context, closest to LLM output)
    parts.push(`## ${responseFormatPrompt.section}\n${responseFormatPrompt.content}\n`);

    // 7. User context (if available)
    if (userContext) {
      parts.push(`\n${userContext}`);
    }

    const prompt = parts.join('\n');

    console.log(`[PromptRouter] Query: "${query.substring(0, 50)}..." → Domains: [${domains.join(', ')}], Capabilities: [${capabilities.join(', ')}]`);
    console.log(`[PromptRouter] Prompt size: ${prompt.length} chars, ~${Math.ceil(prompt.length / 4)} tokens`);

    return prompt;
  }

  /**
   * Format tool definitions for the system prompt.
   */
  private formatTools(tools: ToolDefinition[]): string {
    if (tools.length === 0) {
      return 'No tools available.';
    }

    return tools
      .map(tool => {
        const params = Object.entries(tool.parameters.properties)
          .map(([name, schema]) => {
            const required = tool.parameters.required?.includes(name) ? ' (required)' : '';
            return `    - ${name}${required}: ${schema.description}`;
          })
          .join('\n');

        return `### ${tool.name}\n${tool.description}\n\nParameters:\n${params}`;
      })
      .join('\n\n');
  }
}

// ============================================================================
// Convenience exports
// ============================================================================

/** Singleton instance */
export const promptRouter = new PromptRouter();

/**
 * Get prompt statistics
 */
export function getPromptStats(prompt: string): { charCount: number; estimatedTokens: number } {
  const charCount = prompt.length;
  const estimatedTokens = Math.ceil(charCount / 4);
  return { charCount, estimatedTokens };
}

// Re-export prompt pieces for direct access
export { personaPrompt } from './base/persona';
export { guardrailsPrompt } from './base/guardrails';
export { responseFormatPrompt } from './base/response-format';
export { emailDomainPrompt } from './domains/email';
export { calendarDomainPrompt } from './domains/calendar';
export { generalDomainPrompt } from './domains/general';
export { widgetCapabilityPrompt } from './capabilities/widgets';
