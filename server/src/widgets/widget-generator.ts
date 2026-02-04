/**
 * Widget Generator
 * Generates widgets from LLM responses and tool results
 */

import { WidgetBlock, VDOMNode, WidgetActionDef } from '../types/protocol';
import { ToolResult } from '../types/tools';
import { WidgetDefinition } from '../types/llm';
import { validateWidgetData, getKnownWidgetTypes } from './widget-schemas';

let widgetCounter = 0;

function generateWidgetId(type: string): string {
  return `widget-${type}-${Date.now()}-${++widgetCounter}`;
}

export class WidgetGenerator {
  /**
   * Generate widgets from tool execution results
   */
  generateFromToolResults(results: Map<string, ToolResult>): WidgetBlock[] {
    const widgets: WidgetBlock[] = [];

    for (const [, result] of results) {
      if (result.success && result.widgets) {
        widgets.push(...result.widgets);
      }
    }

    return widgets;
  }

  /**
   * Parse widgets from LLM response
   */
  parseFromLLMResponse(widgetDefs: WidgetDefinition[]): WidgetBlock[] {
    const widgets: WidgetBlock[] = [];

    for (const def of widgetDefs) {
      const widget = this.createWidget(def);
      if (widget) {
        widgets.push(widget);
      }
    }

    return widgets;
  }

  /**
   * Create a widget from definition
   */
  createWidget(def: WidgetDefinition): WidgetBlock | null {
    // Validate the widget data
    const validation = validateWidgetData(def.type, def.data as Record<string, unknown>);

    if (!validation.valid) {
      console.warn(`Widget validation failed for type "${def.type}":`, validation.errors);
      // Try to create anyway for flexibility
    }

    // Handle custom VDOM widgets
    if (def.type === 'custom' && def.vdom) {
      return this.createCustomWidget(def.vdom, def.data as Record<string, unknown>);
    }

    // Create standard widget
    return {
      id: generateWidgetId(def.type),
      type: def.type,
      data: def.data as Record<string, unknown>,
      actions: this.inferActions(def.type, def.data as Record<string, unknown>),
    };
  }

  /**
   * Create a custom VDOM widget
   */
  createCustomWidget(vdom: VDOMNode, data: Record<string, unknown> = {}): WidgetBlock {
    return {
      id: generateWidgetId('custom'),
      type: 'custom',
      data,
      vdom,
    };
  }

  /**
   * Infer appropriate actions based on widget type
   */
  private inferActions(
    type: string,
    data: Record<string, unknown>
  ): WidgetActionDef[] {
    switch (type) {
      case 'email_preview':
        return [
          { id: 'reply', label: 'Reply', type: 'button', variant: 'primary' },
          { id: 'archive', label: 'Archive', type: 'button', variant: 'default' },
          { id: 'open', label: 'Open', type: 'link' },
        ];

      case 'calendar_event':
        const hasMeetingLink = !!(data as { meetingLink?: string }).meetingLink;
        return hasMeetingLink
          ? [
              { id: 'join', label: 'Join Meeting', type: 'button', variant: 'primary' },
              { id: 'decline', label: 'Decline', type: 'button', variant: 'default' },
              { id: 'details', label: 'View Details', type: 'link' },
            ]
          : [
              { id: 'details', label: 'View Details', type: 'button', variant: 'primary' },
              { id: 'decline', label: 'Decline', type: 'button', variant: 'default' },
            ];

      case 'meeting_card':
        return [
          { id: 'join', label: 'Join Meeting', type: 'button', variant: 'primary' },
          { id: 'add_to_calendar', label: 'Add to Calendar', type: 'button', variant: 'default' },
          { id: 'view_agenda', label: 'View Full Agenda', type: 'link' },
        ];

      case 'flight_card':
        return [
          { id: 'book', label: 'Book Now', type: 'button', variant: 'primary' },
          { id: 'details', label: 'Flight Details', type: 'button', variant: 'default' },
          { id: 'compare', label: 'Compare Prices', type: 'link' },
        ];

      case 'form':
        return [
          { id: 'submit', label: 'Submit', type: 'form', variant: 'primary' },
          { id: 'cancel', label: 'Cancel', type: 'button', variant: 'default' },
        ];

      case 'search_results':
        return [
          { id: 'view_all', label: 'View All', type: 'button', variant: 'primary' },
          { id: 'refine', label: 'Refine Search', type: 'link' },
        ];

      default:
        return [];
    }
  }

  /**
   * Merge widgets from multiple sources (tools + LLM)
   */
  mergeWidgets(toolWidgets: WidgetBlock[], llmWidgets: WidgetBlock[]): WidgetBlock[] {
    // Prefer tool widgets as they have real data
    // Add LLM widgets that don't duplicate tool widgets
    const merged = [...toolWidgets];
    const existingTypes = new Set(toolWidgets.map(w => w.type));

    for (const widget of llmWidgets) {
      // Only add custom widgets or widgets of types not already present
      if (widget.type === 'custom' || !existingTypes.has(widget.type)) {
        merged.push(widget);
      }
    }

    return merged;
  }

  /**
   * Get known widget types
   */
  getKnownTypes(): string[] {
    return getKnownWidgetTypes();
  }
}
