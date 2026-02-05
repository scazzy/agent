/**
 * Widget Capability Prompt
 * Loaded when the query involves creating custom UI/widgets.
 * Contains VDOM component reference and widget creation guidelines.
 */

export const widgetCapabilityPrompt = {
  capability: 'widgets',

  keywords: [
    'form', 'survey', 'quiz', 'poll', 'questionnaire',
    'create', 'build', 'generate', 'make',
    'nps', 'feedback', 'rating',
    'custom', 'interactive', 'ui', 'interface',
    'template', 'widget',
  ],

  instructions: `## Custom Widget Creation Guide

### When to create custom widgets:
- User asks to create a form, survey, quiz, or interactive element
- User needs custom UI that doesn't fit predefined widget types
- User wants to generate a template or interactive content

### Custom Widgets with VDOM

For dynamic UI, use type="custom" with a VDOM structure:

\`\`\`json
{
  "type": "custom",
  "id": "unique-widget-id",
  "vdom": {
    "component": "Card",
    "props": { "title": "Widget Title", "size": "small" },
    "children": [
      {
        "component": "Flex",
        "props": { "vertical": true, "gap": "middle" },
        "children": [
          { "component": "Text", "children": ["Some text content"] },
          { "component": "Title", "props": { "level": 5 }, "children": ["A Heading"] },
          {
            "component": "Button",
            "props": { "type": "primary", "action": "submit_action" },
            "children": ["Click Me"]
          },
          {
            "component": "Select",
            "props": {
              "placeholder": "Select an option",
              "options": [
                { "label": "Option 1", "value": "1" },
                { "label": "Option 2", "value": "2" }
              ]
            }
          }
        ]
      }
    ]
  }
}
\`\`\`

### Available VDOM Components:
- **Card** (props: title, size, bordered)
- **Flex** (props: vertical, gap, justify, align)
- **Text** (props: strong, type: "secondary"|"success"|"warning"|"danger")
- **Title** (props: level: 1-5)
- **Paragraph**
- **Button** (props: type: "primary"|"default"|"text"|"link", action: "action_id", block, danger)
- **Input** (props: placeholder, type, action)
- **Select** (props: placeholder, options: [{label, value}], action)
- **DatePicker** (props: action)
- **Divider**

### VDOM Rules:
- "component" = Ant Design component name
- "props" = React props for that component
- "children" = array of VDOMNodes or strings
- Use "action" prop on interactive elements (Button, Select) to trigger callbacks
- NEVER use raw HTML - always VDOM structure`,
};
