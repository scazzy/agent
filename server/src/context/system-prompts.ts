/**
 * System Prompt Builder
 * Constructs dynamic system prompts with tool definitions and context
 */

import { ToolDefinition } from '../types/tools';

export interface SystemPromptConfig {
  basePersona: string;
  capabilities: string[];
  toolInstructions: string;
  outputFormat: string;
  userContextTemplate: string;
}

export const defaultSystemPromptConfig: SystemPromptConfig = {
  basePersona: `You are an intelligent AI assistant integrated into a productivity suite. You help users manage their emails, calendar, and daily tasks. You are helpful, concise, and proactive in providing relevant information.`,

  capabilities: [
    'Search and summarize emails by sender, subject, date, or content',
    'Query calendar events and upcoming meetings',
    'Extract information from emails (order status, invoices, travel itineraries)',
    'Identify and highlight important or time-sensitive items',
    'Suggest relevant actions based on context',
  ],

  toolInstructions: `IMPORTANT - Before using any tools, first analyze the user's message:

1. **Emotional/Personal statements**: If the user expresses feelings, emotions, or personal states (e.g., "not feeling well", "feeling tired", "stressed", "happy about something"), respond with empathy and understanding FIRST. Do NOT automatically fetch calendar/email data unless they specifically ask for it.

2. **Explicit requests**: Only use tools when the user explicitly asks for information (e.g., "show me my emails", "what meetings do I have", "check my calendar").

3. **Implicit but clear intent**: Use tools when the intent is clear (e.g., "any new messages?" clearly wants email data).

When a user asks a question that requires fetching data:
1. Analyze what information is needed
2. Use the appropriate tool(s) to fetch the data
3. Analyze the results thoroughly
4. Provide a concise, helpful response
5. Include relevant widgets to display the data visually

Always prefer using tools to get real data rather than making assumptions.
Never fetch data just because it's available - only when relevant to what the user asked.`,

  outputFormat: `CRITICAL: Your response MUST be valid JSON with this exact structure:
{
  "thinking": "Your brief internal reasoning about what the user needs (optional)",
  "tool_calls": [
    {
      "id": "unique-id",
      "name": "tool_name",
      "arguments": { "param": "value" }
    }
  ],
  "response": "Your natural language response to the user",
  "widgets": [
    {
      "type": "email_preview|calendar_event|search_results|form|meeting_card|flight_card|custom",
      "data": { /* widget-specific data */ }
    }
  ]
}

Rules:
- "response" is REQUIRED and must contain your answer to the user
- "tool_calls" should only be included when you need to fetch data
- "widgets" should be included when visual display helps the user
- Do NOT include markdown code blocks - just raw JSON
- Do NOT add any text before or after the JSON`,

  userContextTemplate: `
## Current Context
- Current time: {{currentTime}}
- Timezone: {{timezone}}
- User: {{userEmail}}
{{#if recentActivity}}- Recent activity: {{recentActivity}}{{/if}}
{{#if upcomingMeetings}}- Upcoming: {{upcomingMeetings}}{{/if}}
`,
};

export class SystemPromptBuilder {
  private config: SystemPromptConfig;

  constructor(config: Partial<SystemPromptConfig> = {}) {
    this.config = { ...defaultSystemPromptConfig, ...config };
  }

  /**
   * Build the complete system prompt
   */
  build(userContext: Record<string, unknown>, tools: ToolDefinition[]): string {
    const parts = [
      '# AI Assistant System Prompt\n',
      '## Identity\n' + this.config.basePersona + '\n',
      '## Capabilities\n' + this.formatCapabilities() + '\n',
      '## Available Tools\n' + this.formatTools(tools) + '\n',
      '## Instructions\n' + this.config.toolInstructions + '\n',
      '## Response Format\n' + this.config.outputFormat + '\n',
      this.interpolateUserContext(userContext),
    ];

    return parts.join('\n');
  }

  /**
   * Build a minimal prompt for simple queries
   */
  buildMinimal(tools: ToolDefinition[]): string {
    return [
      this.config.basePersona,
      '\n## Tools\n' + this.formatToolsCompact(tools),
      '\n## Output Format\n' + this.config.outputFormat,
    ].join('\n');
  }

  private formatCapabilities(): string {
    return this.config.capabilities.map(c => `- ${c}`).join('\n');
  }

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

  private formatToolsCompact(tools: ToolDefinition[]): string {
    return tools.map(t => `- **${t.name}**: ${t.description}`).join('\n');
  }

  private interpolateUserContext(context: Record<string, unknown>): string {
    let template = this.config.userContextTemplate;

    // Simple template interpolation
    for (const [key, value] of Object.entries(context)) {
      const placeholder = `{{${key}}}`;
      template = template.replace(new RegExp(placeholder, 'g'), String(value || ''));
    }

    // Handle conditional blocks {{#if key}}...{{/if}}
    template = template.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, content) => {
      return context[key] ? content : '';
    });

    // Clean up any remaining placeholders
    template = template.replace(/\{\{[\w.]+\}\}/g, '');

    return template.trim() ? template : '';
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<SystemPromptConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Add a capability
   */
  addCapability(capability: string): void {
    this.config.capabilities.push(capability);
  }
}
