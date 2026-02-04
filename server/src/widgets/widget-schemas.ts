/**
 * Widget Schemas
 * JSON schemas for widget validation
 */

export interface WidgetSchema {
  type: 'object';
  properties: Record<string, PropertySchema>;
  required?: string[];
}

export interface PropertySchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  properties?: Record<string, PropertySchema>;
  items?: PropertySchema;
}

export const widgetSchemas: Record<string, WidgetSchema> = {
  email_preview: {
    type: 'object',
    properties: {
      subject: { type: 'string', description: 'Email subject line' },
      sender: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
        },
      },
      snippet: { type: 'string', description: 'Preview text' },
      timestamp: { type: 'string', description: 'ISO timestamp' },
      unread: { type: 'boolean' },
      hasAttachment: { type: 'boolean' },
    },
    required: ['subject', 'sender', 'snippet'],
  },

  calendar_event: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      startTime: { type: 'string', description: 'ISO timestamp' },
      endTime: { type: 'string', description: 'ISO timestamp' },
      location: { type: 'string' },
      description: { type: 'string' },
      meetingLink: { type: 'string' },
      participants: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            status: { type: 'string' },
          },
        },
      },
    },
    required: ['title', 'startTime', 'endTime'],
  },

  search_results: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      resultCount: { type: 'number' },
      results: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            snippet: { type: 'string' },
            type: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
    required: ['query', 'results'],
  },

  form: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      fields: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            label: { type: 'string' },
            type: { type: 'string' },
            required: { type: 'boolean' },
            placeholder: { type: 'string' },
          },
        },
      },
    },
    required: ['title', 'fields'],
  },

  meeting_card: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      startTime: { type: 'string' },
      endTime: { type: 'string' },
      location: { type: 'string' },
      meetingLink: { type: 'string' },
      organizer: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
        },
      },
      attendees: { type: 'array' },
      agenda: { type: 'array' },
    },
    required: ['title', 'startTime', 'endTime'],
  },

  flight_card: {
    type: 'object',
    properties: {
      flightNumber: { type: 'string' },
      airline: { type: 'string' },
      departure: {
        type: 'object',
        properties: {
          airport: { type: 'string' },
          city: { type: 'string' },
          time: { type: 'string' },
          terminal: { type: 'string' },
        },
      },
      arrival: {
        type: 'object',
        properties: {
          airport: { type: 'string' },
          city: { type: 'string' },
          time: { type: 'string' },
          terminal: { type: 'string' },
        },
      },
      duration: { type: 'string' },
      price: {
        type: 'object',
        properties: {
          amount: { type: 'number' },
          currency: { type: 'string' },
        },
      },
    },
    required: ['flightNumber', 'departure', 'arrival'],
  },

  custom: {
    type: 'object',
    properties: {
      vdom: { type: 'object', description: 'Virtual DOM tree' },
    },
    required: [],
  },
};

/**
 * Validate widget data against schema
 */
export function validateWidgetData(
  type: string,
  data: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const schema = widgetSchemas[type];

  if (!schema) {
    // Allow unknown types for custom widgets
    if (type === 'custom') {
      return { valid: true, errors: [] };
    }
    return { valid: false, errors: [`Unknown widget type: ${type}`] };
  }

  const errors: string[] = [];

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (data[field] === undefined || data[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  // Basic type checking for known fields
  for (const [field, value] of Object.entries(data)) {
    const propSchema = schema.properties[field];
    if (propSchema && value !== null && value !== undefined) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (propSchema.type !== actualType) {
        errors.push(`Field "${field}" should be ${propSchema.type}, got ${actualType}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get list of known widget types
 */
export function getKnownWidgetTypes(): string[] {
  return Object.keys(widgetSchemas);
}
