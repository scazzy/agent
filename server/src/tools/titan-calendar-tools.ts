/**
 * Titan Calendar Tools
 * Tool definitions and handlers for real calendar API operations.
 */

import { ToolDefinition, ToolModel, ToolHandler, ToolResult } from '../types/tools';
import {
  TitanCalendarProvider,
  TitanCalendar,
  CalendarEvent,
  decodeCalendarAttr,
  decodeCalendarListAttr,
} from '../providers/titan-calendar-provider';
import { WidgetBlock } from '../types/protocol';

// ============================================================================
// Tool Definitions
// ============================================================================

export const fetchCalendarListTool: ToolModel = {
  name: 'fetch_calendar_list',
  description:
    'Fetch the list of calendars for the user. Returns all calendars including owned, shared, and iCal calendars with their settings.',
  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },
  domain: 'calendar',
  action: { type: 'api', apiName: 'get_calendar_list' },
  usage: {
    when: [
      'User asks "which calendars do I have", "show my calendars", "list calendars"',
      'Need to find the correct calendarId before fetching events',
    ],
    prerequisites: ['Requires authentication'],
    outputFormat: 'widget',
  },
};

export const fetchCalendarTool: ToolModel = {
  name: 'fetch_calendar',
  description:
    'Fetch details of a single calendar by its ID. Returns summary, description, location, and timezone.',
  parameters: {
    type: 'object',
    properties: {
      calendarId: {
        type: 'string',
        description: 'The calendar ID to fetch details for',
      },
    },
    required: ['calendarId'],
  },
  domain: 'calendar',
  action: { type: 'api', apiName: 'get_calendar' },
  usage: {
    when: ['User asks for details about a specific calendar', 'Need calendar metadata (summary, timezone)'],
    prerequisites: ['Requires authentication', 'Requires a calendarId'],
    outputFormat: 'text',
  },
};

export const fetchCalendarEventsTool: ToolModel = {
  name: 'fetch_calendar_events',
  description:
    'Fetch events from a calendar. Supports date range filtering and pagination. If no calendarId is provided, uses the primary calendar.',
  parameters: {
    type: 'object',
    properties: {
      calendarId: {
        type: 'string',
        description: 'Calendar ID to fetch events from. If omitted, uses the primary calendar.',
      },
      startTime: {
        type: 'string',
        description: 'Filter events starting from this time (ISO 8601 format, e.g. "2025-01-15T00:00:00Z")',
      },
      endTime: {
        type: 'string',
        description: 'Filter events ending before this time (ISO 8601 format)',
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of events to return (default: 20)',
      },
      pageToken: {
        type: 'string',
        description: 'Token for fetching the next page of results',
      },
    },
    required: [],
  },
  domain: 'calendar',
  action: { type: 'api', apiName: 'get_calendar_events' },
  usage: {
    when: [
      'User asks about their schedule, meetings, or events',
      'User wants to see calendar for a day/week',
      'Examples: "what\'s on my calendar today", "any meetings this week"',
    ],
    prerequisites: ['Requires authentication'],
    outputFormat: 'both',
  },
};

export const updateCalendarTool: ToolModel = {
  name: 'update_calendar',
  description:
    'Update calendar display settings such as visibility (hidden/shown) and background color.',
  parameters: {
    type: 'object',
    properties: {
      calendarId: {
        type: 'string',
        description: 'The calendar ID to update',
      },
      hidden: {
        type: 'boolean',
        description: 'Set to true to hide the calendar, false to show it',
      },
      bgColor: {
        type: 'string',
        description: 'New background color hex code (e.g. "#536DFE")',
      },
    },
    required: ['calendarId'],
  },
  domain: 'calendar',
  action: { type: 'api', apiName: 'update_calendar' },
  usage: {
    when: [
      'User wants to hide/show a calendar',
      'User wants to change calendar color',
    ],
    prerequisites: ['Requires authentication', 'Requires a calendarId'],
    outputFormat: 'text',
  },
};

// ============================================================================
// Widget Helpers
// ============================================================================

function createCalendarListWidget(calendar: TitanCalendar): WidgetBlock {
  const attrs = decodeCalendarAttr(calendar.calendarAttr);
  const listAttrs = decodeCalendarListAttr(calendar.calendarListAttr);

  return {
    id: `cal-list-${calendar.calendarId}`,
    type: 'calendar_event',
    data: {
      title: calendar.name,
      calendarId: calendar.calendarId,
      timeZone: calendar.timeZone,
      bgColor: calendar.bgColor,
      role: calendar.role,
      isPrimary: attrs.primary,
      isICal: attrs.iCal,
      isHidden: listAttrs.hidden,
      isSelected: listAttrs.selected,
      hasReminders: !!calendar.properties?.reminders,
    },
    actions: [
      { id: 'view_events', label: 'View Events', type: 'button' as const, variant: 'primary' as const },
      { id: 'settings', label: 'Settings', type: 'button' as const, variant: 'default' as const },
    ],
  };
}

function createEventWidget(event: CalendarEvent): WidgetBlock {
  // Convert epoch ms to ISO string for widget display
  const startTimeStr = new Date(event.startTime).toISOString();
  const endTimeStr = new Date(event.endTime).toISOString();

  // Calculate duration
  let duration = 'All day';
  if (!event.isAllDay) {
    const mins = Math.round((event.endTime - event.startTime) / (1000 * 60));
    duration = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`;
  }

  return {
    id: `event-${event.eventId}`,
    type: 'calendar_event',
    data: {
      title: event.title,
      description: event.description,
      startTime: startTimeStr,
      endTime: endTimeStr,
      location: event.location,
      meetingLink: event.meetingLink,
      participants: event.attendees?.map(a => ({
        name: a.name || a.email,
        email: a.email,
        status: a.responseStatus || 'needsAction',
      })) || [],
      organizer: event.organizer ? {
        name: event.organizer.name || event.organizer.email,
        email: event.organizer.email,
      } : undefined,
      isAllDay: event.isAllDay,
      duration,
      timeZone: event.timeZone,
    },
    actions: event.meetingLink
      ? [
          { id: 'join', label: 'Join Meeting', type: 'button' as const, variant: 'primary' as const },
          { id: 'details', label: 'Details', type: 'button' as const, variant: 'default' as const },
        ]
      : [
          { id: 'details', label: 'Details', type: 'button' as const, variant: 'primary' as const },
        ],
  };
}

// ============================================================================
// Tool Handler Factories
// ============================================================================

export function createFetchCalendarListHandler(provider: TitanCalendarProvider): ToolHandler {
  return async (_args: Record<string, unknown>): Promise<ToolResult> => {
    console.log('\n[CalendarTools] ========== fetch_calendar_list CALLED ==========');

    try {
      if (!provider.hasSession()) {
        return { success: false, error: 'Not authenticated. Please login first.' };
      }

      const calendars = await provider.fetchCalendarList();

      console.log(`[CalendarTools] Received ${calendars.length} calendars`);

      const widgets = calendars
        .filter(c => !decodeCalendarAttr(c.calendarAttr).deleted)
        .map(createCalendarListWidget);

      return {
        success: true,
        data: {
          count: calendars.length,
          calendars: calendars.map(c => {
            const attrs = decodeCalendarAttr(c.calendarAttr);
            const listAttrs = decodeCalendarListAttr(c.calendarListAttr);
            return {
              calendarId: c.calendarId,
              name: c.name,
              timeZone: c.timeZone,
              role: c.role,
              isPrimary: attrs.primary,
              isICal: attrs.iCal,
              isHidden: listAttrs.hidden,
              isSelected: listAttrs.selected,
              bgColor: c.bgColor,
            };
          }),
        },
        widgets,
      };
    } catch (error) {
      console.error('[CalendarTools] fetchCalendarList error:', error);
      return {
        success: false,
        error: `Failed to fetch calendar list: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };
}

export function createFetchCalendarHandler(provider: TitanCalendarProvider): ToolHandler {
  return async (args: Record<string, unknown>): Promise<ToolResult> => {
    console.log('\n[CalendarTools] ========== fetch_calendar CALLED ==========');
    console.log('[CalendarTools] Args:', JSON.stringify(args));

    try {
      if (!provider.hasSession()) {
        return { success: false, error: 'Not authenticated. Please login first.' };
      }

      const calendarId = args.calendarId as string;
      
      // Get calendar info from the calendar list (no separate endpoint for single calendar details)
      const calendars = await provider.fetchCalendarList();
      const calendar = calendars.find(c => c.calendarId === calendarId);
      
      if (!calendar) {
        return { success: false, error: `Calendar not found: ${calendarId}` };
      }

      const attrs = decodeCalendarAttr(calendar.calendarAttr);
      const listAttrs = decodeCalendarListAttr(calendar.calendarListAttr);

      console.log(`[CalendarTools] Fetched calendar: ${calendar.name}`);

      return {
        success: true,
        data: {
          calendarId: calendar.calendarId,
          name: calendar.name,
          timeZone: calendar.timeZone,
          bgColor: calendar.bgColor,
          role: calendar.role,
          isPrimary: attrs.primary,
          isICal: attrs.iCal,
          isHidden: listAttrs.hidden,
          isSelected: listAttrs.selected,
        },
      };
    } catch (error) {
      console.error('[CalendarTools] fetchCalendar error:', error);
      return {
        success: false,
        error: `Failed to fetch calendar: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };
}

export function createFetchCalendarEventsHandler(provider: TitanCalendarProvider): ToolHandler {
  return async (args: Record<string, unknown>): Promise<ToolResult> => {
    console.log('\n[CalendarTools] ========== fetch_calendar_events CALLED ==========');
    console.log('[CalendarTools] Args:', JSON.stringify(args));

    try {
      if (!provider.hasSession()) {
        return { success: false, error: 'Not authenticated. Please login first.' };
      }

      let calendarId = args.calendarId as string | undefined;

      // If no calendarId provided, use the primary calendar
      if (!calendarId) {
        const primary = await provider.getPrimaryCalendar();
        if (!primary) {
          return { success: false, error: 'No primary calendar found. Please specify a calendarId.' };
        }
        calendarId = primary.calendarId;
        console.log(`[CalendarTools] Using primary calendar: ${calendarId} (${primary.name})`);
      }

      // Convert ISO strings to epoch ms for API
      const startTimeStr = args.startTime as string | undefined;
      const endTimeStr = args.endTime as string | undefined;
      
      // Default to today + 7 days if no time range provided
      const now = Date.now();
      const startTime = startTimeStr ? new Date(startTimeStr).getTime() : now;
      const endTime = endTimeStr ? new Date(endTimeStr).getTime() : now + (7 * 24 * 60 * 60 * 1000);

      const response = await provider.fetchEvents({
        calendarId,
        startTime,
        endTime,
        pageToken: args.pageToken as string | undefined,
      });

      console.log(`[CalendarTools] Fetched ${response.events.length} events`);

      const widgets = response.events.map(createEventWidget);

      return {
        success: true,
        data: {
          calendarId,
          count: response.events.length,
          hasMore: !!response.pageToken,
          pageToken: response.pageToken,
          syncToken: response.syncToken,
          events: response.events.map(e => ({
            eventId: e.eventId,
            title: e.title,
            startTime: new Date(e.startTime).toISOString(),
            endTime: new Date(e.endTime).toISOString(),
            location: e.location,
            attendeeCount: e.attendees?.length || 0,
            hasMeetingLink: !!e.meetingLink,
            isAllDay: e.isAllDay,
            isRecurring: e.isRecurring,
          })),
        },
        widgets,
      };
    } catch (error) {
      console.error('[CalendarTools] fetchCalendarEvents error:', error);
      return {
        success: false,
        error: `Failed to fetch events: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };
}

export function createUpdateCalendarHandler(provider: TitanCalendarProvider): ToolHandler {
  return async (args: Record<string, unknown>): Promise<ToolResult> => {
    console.log('\n[CalendarTools] ========== update_calendar CALLED ==========');
    console.log('[CalendarTools] Args:', JSON.stringify(args));

    try {
      if (!provider.hasSession()) {
        return { success: false, error: 'Not authenticated. Please login first.' };
      }

      const calendarId = args.calendarId as string;
      const update: Record<string, unknown> = {};
      if (args.hidden !== undefined) update.hidden = args.hidden;
      if (args.bgColor !== undefined) update.bgColor = args.bgColor;

      if (Object.keys(update).length === 0) {
        return { success: false, error: 'No update fields provided. Specify hidden and/or bgColor.' };
      }

      const result = await provider.updateCalendar(calendarId, update);

      // Clear cache since calendar list has changed
      provider.clearCache();

      console.log(`[CalendarTools] Updated calendar: ${result.name}`);

      return {
        success: true,
        data: {
          calendarId: result.calendarId,
          name: result.name,
          timeZone: result.timeZone,
          bgColor: result.bgColor,
          primary: result.primary,
          hidden: result.hidden,
        },
      };
    } catch (error) {
      console.error('[CalendarTools] updateCalendar error:', error);
      return {
        success: false,
        error: `Failed to update calendar: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };
}

// ============================================================================
// Registration
// ============================================================================

export function registerTitanCalendarTools(
  registry: { register: (def: ToolDefinition, handler: ToolHandler) => void },
  provider: TitanCalendarProvider
): void {
  registry.register(fetchCalendarListTool, createFetchCalendarListHandler(provider));
  registry.register(fetchCalendarTool, createFetchCalendarHandler(provider));
  registry.register(fetchCalendarEventsTool, createFetchCalendarEventsHandler(provider));
  registry.register(updateCalendarTool, createUpdateCalendarHandler(provider));
}
