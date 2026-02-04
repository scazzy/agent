import React from 'react';
import { WidgetBlock } from '../../types/protocol';

/**
 * Widget component props
 */
export interface WidgetProps {
  widget: WidgetBlock;
  onAction?: (actionId: string, actionData?: any) => void;
}

/**
 * Widget component type
 */
export type WidgetComponent = React.ComponentType<WidgetProps>;

/**
 * Widget registry - maps widget types to components
 */
class WidgetRegistryClass {
  private widgets: Map<string, WidgetComponent> = new Map();

  /**
   * Register a widget component
   */
  register(type: string, component: WidgetComponent): void {
    this.widgets.set(type, component);
  }

  /**
   * Get a widget component by type
   */
  get(type: string): WidgetComponent | undefined {
    return this.widgets.get(type);
  }

  /**
   * Check if a widget type is registered
   */
  has(type: string): boolean {
    return this.widgets.has(type);
  }

  /**
   * Get all registered widget types
   */
  getAllTypes(): string[] {
    return Array.from(this.widgets.keys());
  }

  /**
   * Unregister a widget type
   */
  unregister(type: string): void {
    this.widgets.delete(type);
  }
}

export const WidgetRegistry = new WidgetRegistryClass();
