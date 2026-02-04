import React from 'react';
import { Alert } from 'antd';
import { WidgetBlock } from '../../types/protocol';
import { WidgetRegistry } from './WidgetRegistry';
import { DynamicWidget } from './DynamicWidget';

interface WidgetRendererProps {
  widget: WidgetBlock;
  onAction?: (actionId: string, actionData?: any) => void;
}

/**
 * Widget Renderer - routes widget blocks to appropriate components
 */
export const WidgetRenderer: React.FC<WidgetRendererProps> = ({ widget, onAction }) => {
  // Check if it's a custom VDOM widget
  if (widget.type === 'custom' && widget.vdom) {
    return <DynamicWidget widget={widget} onAction={onAction} />;
  }

  // Look up widget component in registry
  const WidgetComponent = WidgetRegistry.get(widget.type);

  if (!WidgetComponent) {
    return (
      <Alert
        type="warning"
        message="Unknown Widget"
        description={`Widget type "${widget.type}" is not registered. Available types: ${WidgetRegistry.getAllTypes().join(', ')}`}
        style={{ marginTop: 8 }}
      />
    );
  }

  return <WidgetComponent widget={widget} onAction={onAction} />;
};
