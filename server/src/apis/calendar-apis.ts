/**
 * Calendar API Schemas
 * Defines all calendar-related API endpoints, their request/response shapes,
 * headers, and parameters.
 */

import { ApiDefinition, ApiModule } from '../types/api';

// ============================================================================
// Individual API Definitions
// ============================================================================

/**
 * GET kairos/user/calendarList
 * Fetches all calendars for the authenticated user.
 */
export const getCalendarListApi: ApiDefinition = {
  name: 'get_calendar_list',
  description: 'Fetch the list of calendars for the authenticated user. Returns all calendars including owned, shared, and iCal calendars.',
  method: 'GET',
  path: 'kairos/user/calendarList',
  headers: {
    'X-Supports-ICal': {
      value: 'yes',
      description: 'Tells the server to include iCal calendars in the response',
      required: false,
    },
  },
  response: {
    type: 'array',
    description: 'Array of calendar objects',
    items: {
      type: 'object',
      properties: {
        calendarId: {
          type: 'string',
          description: 'Unique identifier for the calendar',
          example: '6412526373543023890',
        },
        name: {
          type: 'string',
          description: 'Display name of the calendar (often the email for primary)',
          example: 'user1@kairos.com',
        },
        timeZone: {
          type: 'string',
          description: 'IANA timezone identifier',
          example: 'Asia/Kolkata',
        },
        bgColor: {
          type: 'string',
          description: 'Background color hex code for UI display',
          example: '#536DFE',
        },
        calendarListAttr: {
          type: 'number',
          description: 'Bitset of calendar list properties',
          bitset: {
            0: 'hidden',
            1: 'selected',
          },
        },
        calendarAttr: {
          type: 'number',
          description: 'Bitset of calendar properties',
          bitset: {
            0: 'deleted',
            1: 'primary',
            2: 'iCal',
          },
        },
        role: {
          type: 'string',
          description: 'User role on this calendar',
          enum: ['owner', 'writer', 'reader', 'freeBusy'],
        },
        properties: {
          type: 'object',
          description: 'Additional calendar properties',
          properties: {
            icalInfo: {
              type: 'object',
              description: 'iCal sync info (only present for iCal calendars)',
              properties: {
                url: {
                  type: 'string',
                  description: 'iCal feed URL',
                },
                status: {
                  type: 'string',
                  description: 'Sync status',
                  enum: ['ok', 'error'],
                },
                lastSyncAttempt: {
                  type: 'number',
                  description: 'Unix timestamp of last sync attempt',
                },
                lastSyncSuccess: {
                  type: 'number',
                  description: 'Unix timestamp of last successful sync',
                },
                error: {
                  type: 'object',
                  description: 'Error details if sync failed',
                  properties: {
                    errCode: { type: 'number', description: 'HTTP error code' },
                    errReason: { type: 'string', description: 'Error reason text' },
                  },
                },
                interval: {
                  type: 'string',
                  description: 'Sync interval',
                },
                importFailureCount: {
                  type: 'number',
                  description: 'Number of consecutive import failures',
                },
                lastFileMD5: {
                  type: 'string',
                  description: 'MD5 hash of last imported file',
                },
              },
            },
            reminders: {
              type: 'array',
              description: 'Default reminders. Contains exactly 2 elements (push and email). Not present for reader/freeBusy roles. minsBefore=-1 means disabled.',
              items: {
                type: 'object',
                description: 'Reminder configuration',
                properties: {
                  minsBefore: {
                    type: 'number',
                    description: 'Minutes before event to trigger reminder. -1 means no reminder.',
                  },
                  method: {
                    type: 'string',
                    description: 'Reminder delivery method',
                    enum: ['email', 'push'],
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  notes: [
    'calendarListAttr is a bitset: bit 0 = hidden, bit 1 = selected',
    'calendarAttr is a bitset: bit 0 = deleted, bit 1 = primary, bit 2 = iCal',
    'Reminders are not present for reader and freeBusy roles',
    'Reminders list always contains exactly 2 elements with methods push and email',
    'minsBefore = -1 means no reminder for that method',
  ],
};

/**
 * PATCH kairos/user/calendarList/{calendarId}
 * Update calendar display settings for a user.
 */
export const updateCalendarApi: ApiDefinition = {
  name: 'update_calendar',
  description: 'Update calendar display settings for the authenticated user. Can change visibility and color.',
  method: 'PATCH',
  path: 'kairos/user/calendarList/{calendarId}',
  pathParams: {
    calendarId: {
      type: 'string',
      description: 'The calendar ID to update',
      required: true,
    },
  },
  requestBody: {
    type: 'object',
    properties: {
      hidden: {
        type: 'boolean',
        description: 'Whether to hide the calendar from the list',
      },
      bgColor: {
        type: 'string',
        description: 'New background color hex code',
        example: '#448AFF',
      },
    },
  },
  response: {
    type: 'object',
    description: 'Updated calendar object',
    properties: {
      calendarId: {
        type: 'string',
        description: 'Calendar ID',
      },
      name: {
        type: 'string',
        description: 'Calendar name',
      },
      timeZone: {
        type: 'string',
        description: 'Calendar timezone',
      },
      bgColor: {
        type: 'string',
        description: 'Updated background color',
      },
      primary: {
        type: 'boolean',
        description: 'Whether this is the primary calendar',
      },
      hidden: {
        type: 'boolean',
        description: 'Whether the calendar is hidden',
      },
    },
  },
};

/**
 * GET /calendars/{calendarId}
 * Fetch details of a single calendar.
 */
export const getCalendarApi: ApiDefinition = {
  name: 'get_calendar',
  description: 'Fetch details of a single calendar by its ID. Returns summary, description, location, and timezone.',
  method: 'GET',
  path: '/calendars/{calendarId}',
  headers: {
    'X-Supports-ICal': {
      value: 'yes',
      description: 'Tells the server to serve iCal calendar fetch requests',
      required: false,
    },
  },
  pathParams: {
    calendarId: {
      type: 'string',
      description: 'The calendar ID to fetch',
      required: true,
    },
  },
  response: {
    type: 'object',
    description: 'Calendar details',
    properties: {
      summary: {
        type: 'string',
        description: 'Calendar title/summary',
        example: 'team calendar',
      },
      description: {
        type: 'string',
        description: 'Calendar description',
        example: 'All Team Event goes here',
      },
      location: {
        type: 'string',
        description: 'Calendar location',
        example: 'Bangalore',
      },
      timeZone: {
        type: 'string',
        description: 'Calendar timezone',
        example: 'Asia/Delhi',
      },
    },
  },
};

/**
 * GET /calendars/{calendarId}/events
 * Fetch events from a calendar. Supports pagination.
 */
export const getCalendarEventsApi: ApiDefinition = {
  name: 'get_calendar_events',
  description: 'Fetch events from a specific calendar. Results are paginated.',
  method: 'GET',
  path: '/calendars/{calendarId}/events',
  pathParams: {
    calendarId: {
      type: 'string',
      description: 'The calendar ID to fetch events from',
      required: true,
    },
  },
  queryParams: {
    startTime: {
      type: 'string',
      description: 'Filter events starting from this time (ISO 8601 or Unix timestamp)',
    },
    endTime: {
      type: 'string',
      description: 'Filter events ending before this time (ISO 8601 or Unix timestamp)',
    },
    pageToken: {
      type: 'string',
      description: 'Token for fetching the next page of results',
    },
    maxResults: {
      type: 'number',
      description: 'Maximum number of events to return per page',
      default: 20,
    },
  },
  response: {
    type: 'object',
    description: 'Paginated list of calendar events',
    properties: {
      events: {
        type: 'array',
        description: 'List of calendar events',
        items: {
          type: 'object',
          description: 'Calendar event object',
          properties: {
            eventId: {
              type: 'string',
              description: 'Unique event identifier',
            },
            summary: {
              type: 'string',
              description: 'Event title',
            },
            description: {
              type: 'string',
              description: 'Event description',
            },
            location: {
              type: 'string',
              description: 'Event location',
            },
            start: {
              type: 'object',
              description: 'Event start time',
              properties: {
                dateTime: { type: 'string', description: 'ISO 8601 date-time' },
                timeZone: { type: 'string', description: 'IANA timezone' },
              },
            },
            end: {
              type: 'object',
              description: 'Event end time',
              properties: {
                dateTime: { type: 'string', description: 'ISO 8601 date-time' },
                timeZone: { type: 'string', description: 'IANA timezone' },
              },
            },
            attendees: {
              type: 'array',
              description: 'Event attendees',
              items: {
                type: 'object',
                description: 'Attendee details',
                properties: {
                  email: { type: 'string', description: 'Attendee email' },
                  displayName: { type: 'string', description: 'Attendee display name' },
                  responseStatus: {
                    type: 'string',
                    description: 'RSVP status',
                    enum: ['accepted', 'declined', 'tentative', 'needsAction'],
                  },
                  organizer: { type: 'boolean', description: 'Whether this attendee is the organizer' },
                },
              },
            },
            organizer: {
              type: 'object',
              description: 'Event organizer',
              properties: {
                email: { type: 'string', description: 'Organizer email' },
                displayName: { type: 'string', description: 'Organizer display name' },
              },
            },
            status: {
              type: 'string',
              description: 'Event status',
              enum: ['confirmed', 'tentative', 'cancelled'],
            },
            recurrence: {
              type: 'array',
              description: 'Recurrence rules (RRULE format)',
              items: { type: 'string', description: 'RRULE string' },
            },
            meetingLink: {
              type: 'string',
              description: 'Video meeting link if available',
            },
          },
        },
      },
      nextPageToken: {
        type: 'string',
        description: 'Token to fetch the next page. Absent if no more results.',
      },
    },
  },
  pagination: {
    type: 'token',
    paramName: 'pageToken',
    responseTokenField: 'nextPageToken',
  },
  notes: [
    'Results are paginated. Use nextPageToken to fetch subsequent pages.',
    'If nextPageToken is absent in the response, there are no more results.',
    'startTime and endTime can be used to filter events within a date range.',
  ],
};

/**
 * POST /kairos/events/v2/fetchAll
 * Fetch all events from a calendar with pagination and sync support.
 */
export const fetchAllEventsApi: ApiDefinition = {
  name: 'fetch_all_events',
  description: 'Fetch all events from a calendar. Supports date range filtering, pagination via pageToken, and incremental sync via syncToken.',
  method: 'POST',
  path: '/kairos/events/v2/fetchAll',
  headers: {
    'X-Supports-ICal': {
      value: 'yes',
      description: 'Must be present to fetch event details for iCal calendar events',
      required: false,
    },
  },
  requestBody: {
    type: 'object',
    properties: {
      calID: {
        type: 'string',
        description: 'Calendar ID to fetch events from',
        required: true,
      },
      startTime: {
        type: 'number',
        description: 'Start of date range (epoch milliseconds). Required if no token is sent. endTime - startTime must be <= 365 days.',
      },
      endTime: {
        type: 'number',
        description: 'End of date range (epoch milliseconds). Required if no token is sent. Must be > startTime.',
      },
      syncToken: {
        type: 'string',
        description: 'Token from previous response for incremental sync. Mutually exclusive with pageToken. When sent, startTime/endTime must be absent.',
      },
      pageToken: {
        type: 'string',
        description: 'Token from previous response for pagination. Mutually exclusive with syncToken. When sent, startTime/endTime must be absent.',
      },
    },
    required: ['calID'],
  },
  response: {
    type: 'object',
    description: 'Paginated event list with sync/page tokens',
    properties: {
      events: {
        type: 'array',
        description: 'List of event entries, each containing event details and attendees',
        items: {
          type: 'object',
          description: 'Event entry with event details, attendees, and deprecated organizer/creator fields',
          properties: {
            event: {
              type: 'object',
              description: 'Core event object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Unique event identifier',
                  example: 'TITAN_1-0-1738627200-RANDOM0201',
                },
                calID: {
                  type: 'string',
                  description: 'Calendar ID this event belongs to',
                },
                seriesEventID: {
                  type: 'string',
                  description: 'Event ID of the parent series event. Only present for instance events.',
                },
                version: {
                  type: 'number',
                  description: 'Event version number',
                },
                eventInfo: {
                  type: 'object',
                  description: 'Event metadata (title, description, location, conference, organizer, creator)',
                  properties: {
                    title: {
                      type: 'string',
                      description: 'Event title/summary',
                    },
                    description: {
                      type: 'string',
                      description: 'Event description',
                    },
                    location: {
                      type: 'object',
                      description: 'Event location',
                      properties: {
                        locationName: {
                          type: 'string',
                          description: 'Human-readable location name',
                        },
                      },
                    },
                    conference: {
                      type: 'object',
                      description: 'Conference/meeting link info',
                      properties: {
                        conferenceLink: {
                          type: 'string',
                          description: 'URL to join the meeting',
                        },
                      },
                    },
                    organizer: {
                      type: 'object',
                      description: 'Event organizer',
                      properties: {
                        email: { type: 'string', description: 'Organizer email' },
                        name: { type: 'string', description: 'Organizer display name' },
                      },
                    },
                    creator: {
                      type: 'object',
                      description: 'Event creator',
                      properties: {
                        email: { type: 'string', description: 'Creator email' },
                        name: { type: 'string', description: 'Creator display name' },
                      },
                    },
                    props: {
                      type: 'object',
                      description: 'Read-only properties map. Used by backend services (e.g., appointment attrs). May or may not be present.',
                    },
                  },
                },
                timeZone: {
                  type: 'string',
                  description: 'IANA timezone identifier for the event',
                  example: 'Asia/Kolkata',
                },
                startTime: {
                  type: 'number',
                  description: 'Event start time (epoch milliseconds)',
                },
                endTime: {
                  type: 'number',
                  description: 'Event end time (epoch milliseconds)',
                },
                recurrence: {
                  type: 'object',
                  description: 'Recurrence rules. Only present for recurring events. Recurring events are NOT expanded — client must expand using rrules/exDates/rDates.',
                  properties: {
                    rrules: {
                      type: 'array',
                      description: 'iCal RRULE strings defining the recurrence pattern',
                      items: {
                        type: 'string',
                        description: 'RRULE string (e.g., "FREQ=DAILY;COUNT=5;INTERVAL=1")',
                      },
                    },
                    exDates: {
                      type: 'array',
                      description: 'Exception dates (epoch ms) — occurrences to skip. May be absent.',
                      items: {
                        type: 'number',
                        description: 'Epoch milliseconds of excluded occurrence',
                      },
                    },
                    rDates: {
                      type: 'array',
                      description: 'Additional dates (epoch ms) to include. May be absent.',
                      items: {
                        type: 'number',
                        description: 'Epoch milliseconds of additional occurrence',
                      },
                    },
                  },
                },
                attrs: {
                  type: 'number',
                  description: 'Event attributes bitset',
                  bitset: {
                    0: 'IS_RECURRING',
                    1: 'IS_ALLDAY',
                    2: 'GUEST_MODIFY',
                    3: 'GUEST_INVITE',
                    4: 'GUEST_LIST',
                    5: 'IS_DELETED',
                    6: 'IS_V2 (ignore)',
                    7: 'IS_V3 (ignore)',
                    8: 'IS_EXTERNAL_EVENT',
                    9: 'IS_PARENT_CAL_SECONDARY',
                    10: 'IS_PARENT_EVENT',
                    13: 'IS_ICAL_EVENT',
                    14: 'IS_APPOINTMENT_EVENT',
                  },
                },
                createdOn: {
                  type: 'number',
                  description: 'Event creation timestamp (epoch milliseconds)',
                },
                updatedOn: {
                  type: 'number',
                  description: 'Last update timestamp (epoch milliseconds)',
                },
                icsUA: {
                  type: 'number',
                  description: 'iCal update timestamp (epoch milliseconds)',
                },
                seriesEndTime: {
                  type: 'number',
                  description: 'End time of the full recurring series (epoch ms). Present for recurring events.',
                },
                recurId: {
                  type: 'number',
                  description: 'Instance time in the series for which this instance was created (epoch ms). Only present for instance events.',
                },
                sequence: {
                  type: 'number',
                  description: 'Event sequence number (incremented on updates)',
                },
                reminders: {
                  type: 'array',
                  description: 'Event reminders. Null means event follows calendar-level reminder settings. If present, contains exactly 2 elements (push and email). minsBefore=-1 means disabled for that method.',
                  items: {
                    type: 'object',
                    description: 'Reminder configuration',
                    properties: {
                      id: { type: 'string', description: 'Reminder ID' },
                      method: {
                        type: 'string',
                        description: 'Reminder delivery method',
                        enum: ['email', 'push'],
                      },
                      minsBefore: {
                        type: 'number',
                        description: 'Minutes before event to trigger. -1 means no reminder for this method.',
                      },
                    },
                  },
                },
              },
            },
            attendees: {
              type: 'object',
              description: 'Map of attendee email → attendee details. Keys are email addresses.',
              properties: {
                _mapValue: {
                  type: 'object',
                  description: 'Attendee details (each key in the map is an email address)',
                  properties: {
                    responseStatus: {
                      type: 'string',
                      description: 'RSVP status',
                      enum: ['confirmed', 'pending', 'declined', 'tentative'],
                    },
                    name: {
                      type: 'string',
                      description: 'Attendee display name',
                    },
                    attrs: {
                      type: 'number',
                      description: 'Attendee attributes bitset',
                      bitset: {
                        0: 'IS_OPTIONAL',
                        1: 'IS_ORGANIZER',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      syncToken: {
        type: 'string',
        description: 'Token for incremental sync on next request. Mutually exclusive with pageToken in response.',
      },
      pageToken: {
        type: 'string',
        description: 'Token for fetching next page. Mutually exclusive with syncToken in response.',
      },
    },
  },
  pagination: {
    type: 'token',
    paramName: 'pageToken',
    responseTokenField: 'pageToken',
  },
  notes: [
    // Request validation
    'calID is required',
    'startTime/endTime are required if no token is sent; endTime > startTime; range <= 365 days',
    'If syncToken or pageToken is sent, startTime/endTime must be absent',
    'Only one of pageToken/syncToken may be present in request',

    // Response tokens
    'Either syncToken or pageToken is returned in response, never both',
    'Tokens are scoped to the startTime/endTime range they were issued for — not global',
    'A syncToken request can return events of any date (not confined to original range)',
    'A pageToken from a startTime/endTime request returns events within that date range',
    'A pageToken from a syncToken request can return events of any date range',

    // Recurring events
    'Event is recurring only if IS_RECURRING bit (0) is set in attrs — presence of recurrence field alone is not sufficient',
    'Recurring events are NOT expanded — client must expand using rrules, exDates, rDates',
    'Instance events have seriesEventID (parent event ID) and recurId (instance time)',
    'Not every instance event has a corresponding exDate entry',
    'Final valid dates = (expanded recurrence dates) ∪ (recurId of instance events). Instance events override matching recurrence dates, not add to them.',

    // Reminders
    'Reminders is null (follows calendar-level settings) or a list of exactly 2 elements (push + email)',
    'minsBefore = -1 means no reminder for that method',

    // Attendees
    'Attendees is a map of email → { responseStatus, name?, attrs }',
    'Attendee attrs bitset: bit 0 = IS_OPTIONAL, bit 1 = IS_ORGANIZER',

    // Other
    'eventInfo.props is a read-only map populated by backend services (e.g., appointment attrs). May or may not be present.',
    'Deprecated fields (createdBy, organizer at root level, creator at root level) may appear — do not use them',
  ],
};

/**
 * POST /kairos/events/v2/fetch
 * Fetch a single event by ID.
 */
export const fetchEventApi: ApiDefinition = {
  name: 'fetch_event',
  description: 'Fetch a single calendar event by its ID. Returns the full event object with attendees. Returns 404 if event does not exist. Deleted events are returned with IS_DELETED attr set.',
  method: 'POST',
  path: '/kairos/events/v2/fetch',
  headers: {
    'X-Supports-ICal': {
      value: 'yes',
      description: 'Must be present to fetch event details for iCal calendar events',
      required: false,
    },
  },
  requestBody: {
    type: 'object',
    properties: {
      calID: {
        type: 'string',
        description: 'Calendar ID the event belongs to',
        required: true,
      },
      eventId: {
        type: 'string',
        description: 'Event ID to fetch',
        required: true,
      },
    },
    required: ['calID', 'eventId'],
  },
  response: {
    type: 'object',
    description: 'Single event entry (same structure as each element in fetchAll response events array)',
    properties: {
      event: {
        type: 'object',
        description: 'Core event object (same schema as fetchAllEvents event)',
        properties: {
          id: { type: 'string', description: 'Unique event identifier' },
          calID: { type: 'string', description: 'Calendar ID' },
          seriesEventID: { type: 'string', description: 'Parent series event ID (only for instance events)' },
          version: { type: 'number', description: 'Event version number' },
          eventInfo: {
            type: 'object',
            description: 'Event metadata (title, description, location, conference, organizer, creator, props)',
            properties: {
              title: { type: 'string', description: 'Event title' },
              description: { type: 'string', description: 'Event description' },
              location: {
                type: 'object',
                description: 'Event location',
                properties: {
                  locationName: { type: 'string', description: 'Location name' },
                },
              },
              conference: {
                type: 'object',
                description: 'Conference link info',
                properties: {
                  conferenceLink: { type: 'string', description: 'Meeting URL' },
                },
              },
              organizer: {
                type: 'object',
                description: 'Event organizer',
                properties: {
                  email: { type: 'string', description: 'Organizer email' },
                  name: { type: 'string', description: 'Organizer name' },
                },
              },
              creator: {
                type: 'object',
                description: 'Event creator',
                properties: {
                  email: { type: 'string', description: 'Creator email' },
                  name: { type: 'string', description: 'Creator name' },
                },
              },
              props: {
                type: 'object',
                description: 'Read-only properties map (may or may not be present)',
              },
            },
          },
          timeZone: { type: 'string', description: 'IANA timezone' },
          startTime: { type: 'number', description: 'Start time (epoch ms)' },
          endTime: { type: 'number', description: 'End time (epoch ms)' },
          recurrence: {
            type: 'object',
            description: 'Recurrence rules (only for recurring events)',
            properties: {
              rrules: {
                type: 'array',
                description: 'RRULE strings',
                items: { type: 'string', description: 'RRULE string' },
              },
              exDates: {
                type: 'array',
                description: 'Exception dates (epoch ms)',
                items: { type: 'number', description: 'Excluded occurrence epoch ms' },
              },
              rDates: {
                type: 'array',
                description: 'Additional dates (epoch ms)',
                items: { type: 'number', description: 'Additional occurrence epoch ms' },
              },
            },
          },
          attrs: {
            type: 'number',
            description: 'Event attributes bitset (same as fetchAll)',
            bitset: {
              0: 'IS_RECURRING',
              1: 'IS_ALLDAY',
              2: 'GUEST_MODIFY',
              3: 'GUEST_INVITE',
              4: 'GUEST_LIST',
              5: 'IS_DELETED',
              8: 'IS_EXTERNAL_EVENT',
              9: 'IS_PARENT_CAL_SECONDARY',
              10: 'IS_PARENT_EVENT',
              13: 'IS_ICAL_EVENT',
              14: 'IS_APPOINTMENT_EVENT',
            },
          },
          createdOn: { type: 'number', description: 'Creation timestamp (epoch ms)' },
          updatedOn: { type: 'number', description: 'Last update timestamp (epoch ms)' },
          icsUA: { type: 'number', description: 'iCal update timestamp (epoch ms)' },
          seriesEndTime: { type: 'number', description: 'Series end time (epoch ms, recurring events)' },
          recurId: { type: 'number', description: 'Instance time in series (epoch ms, instance events only)' },
          sequence: { type: 'number', description: 'Event sequence number' },
          reminders: {
            type: 'array',
            description: 'Reminders (null = calendar-level, or exactly 2 elements: push + email)',
            items: {
              type: 'object',
              description: 'Reminder configuration',
              properties: {
                id: { type: 'string', description: 'Reminder ID' },
                method: { type: 'string', description: 'Delivery method', enum: ['email', 'push'] },
                minsBefore: { type: 'number', description: 'Minutes before event (-1 = disabled)' },
              },
            },
          },
        },
      },
      attendees: {
        type: 'object',
        description: 'Map of attendee email → { responseStatus, name?, attrs }',
        properties: {
          _mapValue: {
            type: 'object',
            description: 'Attendee details (each key is an email address)',
            properties: {
              responseStatus: { type: 'string', description: 'RSVP status', enum: ['confirmed', 'pending', 'declined', 'tentative'] },
              name: { type: 'string', description: 'Attendee display name' },
              attrs: {
                type: 'number',
                description: 'Attendee attributes bitset',
                bitset: { 0: 'IS_OPTIONAL', 1: 'IS_ORGANIZER' },
              },
            },
          },
        },
      },
    },
  },
  notes: [
    'calID and eventId are both required',
    'Returns 404 if event does not exist',
    'Deleted events are returned with IS_DELETED bit (5) set in event.attrs',
    'Response structure is the same as a single element from fetchAllEvents response',
  ],
};

// ============================================================================
// Calendar API Module (groups all calendar APIs)
// ============================================================================

export const calendarApiModule: ApiModule = {
  name: 'calendar',
  commonHeaders: {
    'X-Supports-ICal': {
      value: 'yes',
      description: 'Tells the server to include iCal calendars in responses',
      required: false,
    },
  },
  apis: [
    getCalendarListApi,
    updateCalendarApi,
    getCalendarApi,
    getCalendarEventsApi,
    fetchAllEventsApi,
    fetchEventApi,
  ],
};
