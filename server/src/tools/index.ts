/**
 * Tools Module Exports
 */

export { ToolRegistry } from './tool-registry';
export { ToolExecutor } from './tool-executor';

// Re-export key types from types/tools for convenience
export type { ToolDefinition, ToolModel, ToolDomain, ToolAction, ToolUsage, ToolHandler, ToolResult } from '../types/tools';

export {
  searchEmailsTool,
  getEmailDetailsTool,
  getUnreadEmailsTool,
  createSearchEmailsHandler,
  createGetEmailDetailsHandler,
  createGetUnreadEmailsHandler,
  registerEmailTools,
} from './email-tools';

export {
  fetchMessagesTool,
  fetchMessageSnippetTool,
  fetchMessageBodyTool,
  titanSearchEmailsTool,
  createFetchMessagesHandler,
  createFetchMessageSnippetHandler,
  createFetchMessageBodyHandler,
  createTitanSearchEmailsHandler,
  registerMessageTools,
} from './message-tools';

export {
  fetchCalendarListTool,
  fetchCalendarTool,
  fetchCalendarEventsTool,
  updateCalendarTool,
  createFetchCalendarListHandler,
  createFetchCalendarHandler,
  createFetchCalendarEventsHandler,
  createUpdateCalendarHandler,
  registerTitanCalendarTools,
} from './titan-calendar-tools';
