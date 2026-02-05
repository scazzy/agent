/**
 * API Schema Types
 * Defines interfaces for documenting API endpoints, their request/response shapes,
 * headers, and parameters. Similar to ToolDefinition but for HTTP APIs.
 */

export interface ApiFieldSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  enum?: string[];
  items?: ApiFieldSchema;
  properties?: Record<string, ApiFieldSchema>;
  required?: boolean;
  /** Example value for documentation */
  example?: unknown;
  /** Default value if not provided */
  default?: unknown;
  /** Indicates this field is a bitset with documented bit positions */
  bitset?: Record<number, string>;
}

export interface ApiDefinition {
  /** Unique identifier for this API endpoint */
  name: string;
  /** Human-readable description of what this endpoint does */
  description: string;
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** URL path pattern (e.g., "/calendars/{calendarId}") */
  path: string;
  /** Required or optional headers */
  headers?: Record<string, {
    value: string;
    description: string;
    required?: boolean;
  }>;
  /** URL path parameters (e.g., calendarId) */
  pathParams?: Record<string, ApiFieldSchema>;
  /** URL query parameters */
  queryParams?: Record<string, ApiFieldSchema>;
  /** Request body schema (for POST/PUT/PATCH) */
  requestBody?: {
    type: 'object';
    properties: Record<string, ApiFieldSchema>;
    required?: string[];
  };
  /** Response body schema */
  response: {
    type: 'object' | 'array';
    description?: string;
    /** For array responses, describes each item */
    items?: {
      type: 'object';
      properties: Record<string, ApiFieldSchema>;
    };
    /** For object responses */
    properties?: Record<string, ApiFieldSchema>;
  };
  /** Whether this endpoint supports pagination */
  pagination?: {
    type: 'cursor' | 'offset' | 'token';
    /** Parameter name for the pagination token/cursor */
    paramName: string;
    /** Response field containing the next page token */
    responseTokenField?: string;
  };
  /** Additional notes about the endpoint behavior */
  notes?: string[];
}

/**
 * A collection of related API definitions (e.g., all calendar APIs)
 */
export interface ApiModule {
  /** Module name (e.g., "calendar", "email") */
  name: string;
  /** Base path prefix for all endpoints in this module */
  basePath?: string;
  /** Common headers applied to all endpoints */
  commonHeaders?: Record<string, {
    value: string;
    description: string;
    required?: boolean;
  }>;
  /** The API endpoint definitions */
  apis: ApiDefinition[];
}
