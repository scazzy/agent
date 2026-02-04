/**
 * Tools Module Exports
 */

export { ToolRegistry } from './tool-registry';
export { ToolExecutor } from './tool-executor';

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
  searchCalendarTool,
  getTodayEventsTool,
  getUpcomingEventsTool,
  getFreeBusyTool,
  createSearchCalendarHandler,
  createGetTodayEventsHandler,
  createGetUpcomingEventsHandler,
  createGetFreeBusyHandler,
  registerCalendarTools,
} from './calendar-tools';
