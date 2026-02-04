import React from 'react';
import { WidgetProps } from './WidgetRegistry';
import { VDOMRenderer } from '../../lib/vdom-renderer';

/**
 * Dynamic Widget - renders custom widgets from VDOM
 */
export const DynamicWidget: React.FC<WidgetProps> = ({ widget, onAction }) => {
  if (!widget.vdom) {
    return null;
  }

  return <VDOMRenderer vdom={widget.vdom} onAction={onAction} />;
};
