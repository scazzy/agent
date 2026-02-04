/**
 * Calendar Tools
 * Tool definitions and handlers for calendar operations
 */

import { ToolDefinition, ToolHandler, ToolResult } from '../types/tools';
import { CalendarProvider } from '../providers/calendar-provider';
import { CalendarEvent } from '../providers/types';
import { WidgetBlock } from '../types/protocol';

// Tool Definitions

export const searchCalendarTool: ToolDefinition = {
  name: 'search_calendar',
  description:
    'Search calendar events by date, attendee, or title. Use "today" or "tomorrow" for date, or specific dates in ISO format.',
  parameters: {
    type: 'object',
    properties: {
      date: {
        type: 'string',
        description: 'Specific date - use "today", "tomorrow", or ISO date format',
      },
      dateFrom: {
        type: 'string',
        description: 'Start of date range (ISO format)',
      },
      dateTo: {
        type: 'string',
        description: 'End of date range (ISO format)',
      },
      attendee: {
        type: 'string',
        description: 'Filter by attendee name or email',
      },
      title: {
        type: 'string',
        description: 'Filter by event title (partial match)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results (default: 10)',
      },
    },
    required: [],
  },
};

export const getTodayEventsTool: ToolDefinition = {
  name: 'get_today_events',
  description: 'Get all calendar events for today',
  parameters: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of results (default: 10)',
      },
    },
    required: [],
  },
};

export const getUpcomingEventsTool: ToolDefinition = {
  name: 'get_upcoming_events',
  description: 'Get upcoming calendar events starting from now',
  parameters: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of results (default: 5)',
      },
    },
    required: [],
  },
};

export const getFreeBusyTool: ToolDefinition = {
  name: 'get_free_busy',
  description: 'Check if a time slot is available or has conflicts',
  parameters: {
    type: 'object',
    properties: {
      dateFrom: {
        type: 'string',
        description: 'Start of time range (ISO format)',
      },
      dateTo: {
        type: 'string',
        description: 'End of time range (ISO format)',
      },
    },
    required: ['dateFrom', 'dateTo'],
  },
};

// Widget creation helper
function createCalendarEventWidget(event: CalendarEvent): WidgetBlock {
  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);

  return {
    id: `calendar-widget-${event.id}`,
    type: 'calendar_event',
    data: {
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      meetingLink: event.meetingLink,
      participants: event.attendees.map(a => ({
        name: a.name,
        email: a.email,
        status: a.status,
      })),
      organizer: event.organizer,
      isAllDay: event.isAllDay,
      duration: event.isAllDay
        ? 'All day'
        : `${Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))} min`,
    },
    actions: event.meetingLink
      ? [
          { id: 'join', label: 'Join Meeting', type: 'button' as const, variant: 'primary' as const },
          { id: 'decline', label: 'Decline', type: 'button' as const, variant: 'default' as const },
          { id: 'details', label: 'View Details', type: 'link' as const },
        ]
      : [
          { id: 'details', label: 'View Details', type: 'button' as const, variant: 'primary' as const },
          { id: 'decline', label: 'Decline', type: 'button' as const, variant: 'default' as const },
        ],
  };
}

function createMeetingCardWidget(event: CalendarEvent): WidgetBlock {
  return {
    id: `meeting-card-${event.id}`,
    type: 'meeting_card',
    data: {
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      meetingLink: event.meetingLink,
      organizer: event.organizer,
      attendees: event.attendees.map(a => ({
        name: a.name,
        email: a.email,
        status: a.status,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&size=32`,
      })),
      agenda: event.description?.split('\n').filter(line => line.trim()) || [],
    },
    actions: [
      { id: 'join', label: 'Join Meeting', type: 'button' as const, variant: 'primary' as const },
      { id: 'add_to_calendar', label: 'Add to Calendar', type: 'button' as const, variant: 'default' as const },
      { id: 'view_agenda', label: 'View Full Agenda', type: 'link' as const },
    ],
  };
}

// Tool Handler Factories

export function createSearchCalendarHandler(provider: CalendarProvider): ToolHandler {
  return async (args: Record<string, unknown>): Promise<ToolResult> => {
    try {
      const results = await provider.search({
        date: args.date as string | undefined,
        dateFrom: args.dateFrom as string | undefined,
        dateTo: args.dateTo as string | undefined,
        attendee: args.attendee as string | undefined,
        title: args.title as string | undefined,
        limit: (args.limit as number) || 10,
      });

      return {
        success: true,
        data: {
          count: results.length,
          events: results.map(e => ({
            id: e.id,
            title: e.title,
            startTime: e.startTime,
            endTime: e.endTime,
            location: e.location,
            attendeeCount: e.attendees.length,
            hasMeetingLink: !!e.meetingLink,
          })),
        },
        widgets: results.map(createCalendarEventWidget),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to search calendar: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };
}

export function createGetTodayEventsHandler(provider: CalendarProvider): ToolHandler {
  return async (args: Record<string, unknown>): Promise<ToolResult> => {
    try {
      const results = await provider.getToday();
      const limit = (args.limit as number) || 10;
      const limited = results.slice(0, limit);

      return {
        success: true,
        data: {
          count: limited.length,
          totalToday: results.length,
          events: limited.map(e => ({
            id: e.id,
            title: e.title,
            startTime: e.startTime,
            endTime: e.endTime,
            location: e.location,
          })),
        },
        widgets: limited.map(createCalendarEventWidget),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get today's events: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };
}

export function createGetUpcomingEventsHandler(provider: CalendarProvider): ToolHandler {
  return async (args: Record<string, unknown>): Promise<ToolResult> => {
    try {
      const limit = (args.limit as number) || 5;
      const results = await provider.getRecent(limit);

      return {
        success: true,
        data: {
          count: results.length,
          events: results.map(e => ({
            id: e.id,
            title: e.title,
            startTime: e.startTime,
            endTime: e.endTime,
            location: e.location,
          })),
        },
        widgets: results.map(createMeetingCardWidget),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get upcoming events: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };
}

export function createGetFreeBusyHandler(provider: CalendarProvider): ToolHandler {
  return async (args: Record<string, unknown>): Promise<ToolResult> => {
    try {
      const dateFrom = new Date(args.dateFrom as string);
      const dateTo = new Date(args.dateTo as string);

      const result = await provider.getFreeBusy(dateFrom, dateTo);

      return {
        success: true,
        data: {
          available: !result.busy,
          conflictCount: result.conflicts.length,
          conflicts: result.conflicts.map(e => ({
            id: e.id,
            title: e.title,
            startTime: e.startTime,
            endTime: e.endTime,
          })),
        },
        widgets: result.busy ? result.conflicts.map(createCalendarEventWidget) : [],
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to check availability: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };
}

// Register all calendar tools
export function registerCalendarTools(
  registry: { register: (def: ToolDefinition, handler: ToolHandler) => void },
  provider: CalendarProvider
): void {
  registry.register(searchCalendarTool, createSearchCalendarHandler(provider));
  registry.register(getTodayEventsTool, createGetTodayEventsHandler(provider));
  registry.register(getUpcomingEventsTool, createGetUpcomingEventsHandler(provider));
  registry.register(getFreeBusyTool, createGetFreeBusyHandler(provider));
}
