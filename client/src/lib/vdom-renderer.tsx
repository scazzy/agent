import React from 'react';
import {
  Button,
  Card,
  Typography,
  Flex,
  Divider,
  Input,
  Select,
  DatePicker,
} from 'antd';
import { VDOMNode } from '../types/protocol';

const { Text, Title, Paragraph } = Typography;

/**
 * Component registry for VDOM rendering
 */
const componentMap: Record<string, React.ComponentType<any>> = {
  Button,
  Card,
  Text,
  Title,
  Paragraph,
  Flex,
  Divider,
  Input,
  Select,
  DatePicker,
};

/**
 * Props for VDOM renderer
 */
interface VDOMRendererProps {
  vdom: VDOMNode;
  onAction?: (actionId: string, actionData?: any) => void;
}

/**
 * Recursively render VDOM nodes to React components
 */
export function renderVDOM(
  vdom: VDOMNode | string,
  onAction?: (actionId: string, actionData?: any) => void,
  key?: number
): React.ReactNode {
  // Handle text nodes
  if (typeof vdom === 'string') {
    return vdom;
  }

  // Get component from registry
  const Component = componentMap[vdom.component];

  if (!Component) {
    console.warn(`Unknown VDOM component: ${vdom.component}`);
    return null;
  }

  // Process props
  const props: any = { ...vdom.props };

  // Handle action prop for buttons
  if (props.action && onAction) {
    const actionId = props.action;
    delete props.action;

    props.onClick = () => {
      onAction(actionId);
    };
  }

  // Add key for list rendering
  if (key !== undefined) {
    props.key = key;
  }

  // Render children
  const children = vdom.children
    ? vdom.children.map((child, index) => renderVDOM(child, onAction, index))
    : undefined;

  return React.createElement(Component, props, children);
}

/**
 * VDOM Renderer Component
 */
export const VDOMRenderer: React.FC<VDOMRendererProps> = ({ vdom, onAction }) => {
  return <>{renderVDOM(vdom, onAction)}</>;
};
