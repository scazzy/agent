/**
 * Titan Calendar Provider
 * Calls real calendar APIs to fetch calendars and events.
 */

import { SessionInfo } from '../types/protocol';

// ============================================================================
// Titan Calendar API Types
// ============================================================================

export interface CalendarReminder {
  minsBefore: number;
  method: 'email' | 'push';
}

export interface ICalError {
  errCode: number;
  errReason: string;
}

export interface ICalInfo {
  url: string;
  status: 'ok' | 'error';
  lastSyncAttempt?: number;
  lastSyncSuccess?: number;
  error?: ICalError;
  interval?: string;
  importFailureCount?: number;
  lastFileMD5?: string;
}

export interface CalendarProperties {
  icalInfo?: ICalInfo;
  reminders?: CalendarReminder[];
}

export interface TitanCalendar {
  calendarId: string;
  name: string;
  timeZone: string;
  bgColor: string;
  calendarListAttr: number;
  calendarAttr: number;
  role: 'owner' | 'writer' | 'reader' | 'freeBusy';
  properties?: CalendarProperties;
}

export interface CalendarDetail {
  summary: string;
  description?: string;
  location?: string;
  timeZone: string;
}

export interface CalendarUpdateRequest {
  hidden?: boolean;
  bgColor?: string;
}

export interface CalendarUpdateResponse {
  calendarId: string;
  name: string;
  timeZone: string;
  bgColor: string;
  primary: boolean;
  hidden: boolean;
}

// Event Info (nested in TitanEvent)
export interface EventLocation {
  locationName?: string;
}

export interface EventConference {
  conferenceLink?: string;
}

export interface EventPerson {
  email: string;
  name?: string;
  self?: boolean; // Deprecated but may be present
}

export interface EventInfo {
  title?: string;
  description?: string;
  location?: EventLocation;
  conference?: EventConference;
  organizer?: EventPerson;
  creator?: EventPerson;
  props?: Record<string, unknown>; // Read-only properties
}

export interface EventRecurrence {
  rrules?: string[];
  exDates?: number[]; // epoch ms
  rDates?: number[];  // epoch ms
}

export interface EventReminder {
  id?: string;
  method: 'email' | 'push';
  minsBefore: number; // -1 means disabled
}

// Core event structure from /events/v2/fetchAll
export interface TitanEventCore {
  id: string;
  calID: string;
  seriesEventID?: string; // Only for instance events
  version: number;
  eventInfo: EventInfo;
  timeZone: string;
  startTime: number;      // epoch ms
  endTime: number;        // epoch ms
  recurrence?: EventRecurrence;
  attrs: number;          // Bitset - see decodeEventAttr
  createdOn: number;
  updatedOn: number;
  icsUA?: number;
  seriesEndTime?: number;
  recurId?: number;       // Only for instance events
  sequence?: number;
  reminders?: EventReminder[] | null;
}

// Attendee map (keyed by email)
export interface EventAttendeeInfo {
  responseStatus: 'confirmed' | 'pending' | 'declined' | 'tentative';
  name?: string;
  attrs: number; // bit 0 = optional, bit 1 = organizer
}

// Full event response object
export interface TitanEventResponse {
  event: TitanEventCore;
  attendees?: Record<string, EventAttendeeInfo>;
  organizer?: EventPerson;  // Deprecated, use eventInfo.organizer
  creator?: EventPerson;    // Deprecated
}

// Request/Response for /events/v2/fetchAll
export interface FetchEventsRequest {
  calID: string;
  startTime?: number;     // epoch ms (required if no token)
  endTime?: number;       // epoch ms (required if no token)
  syncToken?: string;
  pageToken?: string;
}

export interface FetchEventsResponse {
  events: TitanEventResponse[];
  syncToken?: string;
  pageToken?: string;
}

// Request for /events/v2/fetch (single event)
export interface FetchEventRequest {
  calID: string;
  eventId: string;
}

// Simplified CalendarEvent for tools/widgets (transformed from TitanEventResponse)
export interface CalendarEvent {
  eventId: string;
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: number;      // epoch ms
  endTime: number;        // epoch ms
  timeZone: string;
  isAllDay: boolean;
  isRecurring: boolean;
  meetingLink?: string;
  attendees: Array<{
    email: string;
    name?: string;
    responseStatus: string;
    isOrganizer: boolean;
  }>;
  organizer?: {
    email: string;
    name?: string;
  };
  reminders?: EventReminder[] | null;
}

// ============================================================================
// Helper: decode bitset attributes
// ============================================================================

export function decodeCalendarListAttr(attr: number): { hidden: boolean; selected: boolean } {
  return {
    hidden: (attr & 1) === 1,    // bit 0
    selected: (attr & 2) === 2,  // bit 1
  };
}

export function decodeCalendarAttr(attr: number): { deleted: boolean; primary: boolean; iCal: boolean } {
  return {
    deleted: (attr & 1) === 1,   // bit 0
    primary: (attr & 2) === 2,   // bit 1
    iCal: (attr & 4) === 4,      // bit 2
  };
}

export function decodeEventAttr(attr: number): {
  isRecurring: boolean;
  isAllDay: boolean;
  guestModify: boolean;
  guestInvite: boolean;
  guestList: boolean;
  isDeleted: boolean;
  isExternalEvent: boolean;
  isParentCalSecondary: boolean;
  isParentEvent: boolean;
  isICalEvent: boolean;
  isAppointmentEvent: boolean;
} {
  return {
    isRecurring: (attr & (1 << 0)) !== 0,
    isAllDay: (attr & (1 << 1)) !== 0,
    guestModify: (attr & (1 << 2)) !== 0,
    guestInvite: (attr & (1 << 3)) !== 0,
    guestList: (attr & (1 << 4)) !== 0,
    isDeleted: (attr & (1 << 5)) !== 0,
    isExternalEvent: (attr & (1 << 8)) !== 0,
    isParentCalSecondary: (attr & (1 << 9)) !== 0,
    isParentEvent: (attr & (1 << 10)) !== 0,
    isICalEvent: (attr & (1 << 13)) !== 0,
    isAppointmentEvent: (attr & (1 << 14)) !== 0,
  };
}

export function decodeAttendeeAttr(attr: number): { isOptional: boolean; isOrganizer: boolean } {
  return {
    isOptional: (attr & 1) === 1,   // bit 0
    isOrganizer: (attr & 2) === 2,  // bit 1
  };
}

/**
 * Transform TitanEventResponse to simplified CalendarEvent
 */
function transformEvent(response: TitanEventResponse): CalendarEvent {
  const { event, attendees } = response;
  const attrs = decodeEventAttr(event.attrs);
  
  // Transform attendees map to array
  const attendeeList = attendees
    ? Object.entries(attendees).map(([email, info]) => ({
        email,
        name: info.name,
        responseStatus: info.responseStatus,
        isOrganizer: decodeAttendeeAttr(info.attrs).isOrganizer,
      }))
    : [];

  return {
    eventId: event.id,
    calendarId: event.calID,
    title: event.eventInfo?.title || '(No Title)',
    description: event.eventInfo?.description,
    location: event.eventInfo?.location?.locationName,
    startTime: event.startTime,
    endTime: event.endTime,
    timeZone: event.timeZone,
    isAllDay: attrs.isAllDay,
    isRecurring: attrs.isRecurring,
    meetingLink: event.eventInfo?.conference?.conferenceLink,
    attendees: attendeeList,
    organizer: event.eventInfo?.organizer,
    reminders: event.reminders,
  };
}

// ============================================================================
// Provider
// ============================================================================

// Calendar API uses a fixed base URL (NOT the per-cluster email baseUrl)
const CALENDAR_API_BASE_URLS = {
  staging: 'https://titan-backend.flock-staging.com',
  prod: 'https://api.titan.email',
};

/**
 * Titan Calendar Provider - fetches real calendar data from APIs.
 * Note: Calendar APIs use a fixed base URL, not the per-cluster email baseUrl.
 */
export class TitanCalendarProvider {
  private baseUrl: string;
  private session: SessionInfo | null = null;
  private calendarsCache: TitanCalendar[] | null = null;

  constructor(env: 'staging' | 'prod' = 'staging') {
    this.baseUrl = CALENDAR_API_BASE_URLS[env];
  }

  /**
   * Set session for authenticated requests
   * Note: Calendar uses fixed base URL, so we DON'T use session.baseUrl
   */
  setSession(session: SessionInfo): void {
    this.session = session;
    // Calendar API uses fixed URL, NOT session.baseUrl (which is for email APIs)
    // Reset cache when session changes
    this.calendarsCache = null;
  }

  /**
   * Check if session is available
   */
  hasSession(): boolean {
    return this.session !== null;
  }

  /**
   * Make authenticated request to calendar API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    extraHeaders?: Record<string, string>
  ): Promise<T> {
    if (!this.session) {
      throw new Error('No session available. Please login first.');
    }

    const base = this.baseUrl.replace(/\/+$/, '');
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${base}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Session-Token': this.session.session,
      'X-Supports-ICal': 'yes',
      ...extraHeaders,
      ...((options.headers as Record<string, string>) || {}),
    };

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[TitanCalendar API] ${options.method || 'GET'} ${url}`);
    console.log(`[TitanCalendar API] Session: ${this.session.session.substring(0, 20)}...`);
    if (options.body) {
      console.log(`[TitanCalendar API] Body: ${options.body}`);
    }
    console.log(`${'='.repeat(60)}\n`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`[TitanCalendar API] Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TitanCalendar API] Error Response: ${errorText}`);
      throw new Error(`Calendar API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[TitanCalendar API] Response Data:`, JSON.stringify(data, null, 2).substring(0, 500) + '...');

    return data as T;
  }

  /**
   * GET kairos/user/calendarList
   * Fetch all calendars for the authenticated user.
   */
  async fetchCalendarList(): Promise<TitanCalendar[]> {
    if (this.calendarsCache) {
      console.log('[TitanCalendar] Returning cached calendar list');
      return this.calendarsCache;
    }

    const calendars = await this.request<TitanCalendar[]>('/kairos/user/calendarList');
    this.calendarsCache = calendars;

    console.log(`[TitanCalendar] Loaded ${calendars.length} calendars:`);
    calendars.forEach(c => {
      const attrs = decodeCalendarAttr(c.calendarAttr);
      console.log(`  - id=${c.calendarId}, name="${c.name}", role=${c.role}, primary=${attrs.primary}, iCal=${attrs.iCal}`);
    });

    return calendars;
  }

  /**
   * Find the primary calendar from the list.
   */
  async getPrimaryCalendar(): Promise<TitanCalendar | null> {
    const calendars = await this.fetchCalendarList();
    return calendars.find(c => decodeCalendarAttr(c.calendarAttr).primary) || null;
  }

  /**
   * PATCH kairos/user/calendarList/{calendarId}
   * Update calendar display settings.
   */
  async updateCalendar(calendarId: string, update: CalendarUpdateRequest): Promise<CalendarUpdateResponse> {
    return this.request<CalendarUpdateResponse>(
      `/kairos/user/calendarList/${calendarId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(update),
      }
    );
  }

  /**
   * POST /kairos/events/v2/fetchAll
   * Fetch events from a calendar with date range and pagination.
   * Note: endTime - startTime must be <= 365 days
   */
  async fetchEvents(params: {
    calendarId: string;
    startTime?: number;    // epoch ms
    endTime?: number;      // epoch ms
    syncToken?: string;
    pageToken?: string;
  }): Promise<{ events: CalendarEvent[]; syncToken?: string; pageToken?: string }> {
    const { calendarId, startTime, endTime, syncToken, pageToken } = params;

    const body: FetchEventsRequest = {
      calID: calendarId,
    };

    // Either tokens OR time range, not both
    if (syncToken) {
      body.syncToken = syncToken;
    } else if (pageToken) {
      body.pageToken = pageToken;
    } else {
      // Time range required if no tokens
      body.startTime = startTime;
      body.endTime = endTime;
    }

    const response = await this.request<FetchEventsResponse>(
      '/kairos/events/v2/fetchAll',
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );

    // Transform to simplified CalendarEvent format
    const events = response.events.map(transformEvent);

    console.log(`[TitanCalendar] Fetched ${events.length} events from calendar ${calendarId}`);

    return {
      events,
      syncToken: response.syncToken,
      pageToken: response.pageToken,
    };
  }

  /**
   * POST /kairos/events/v2/fetch
   * Fetch a single event by ID.
   */
  async fetchEvent(calendarId: string, eventId: string): Promise<CalendarEvent | null> {
    try {
      const response = await this.request<TitanEventResponse>(
        '/kairos/events/v2/fetch',
        {
          method: 'POST',
          body: JSON.stringify({
            calID: calendarId,
            eventId: eventId,
          } as FetchEventRequest),
        }
      );

      return transformEvent(response);
    } catch (error) {
      // 404 means event doesn't exist
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Fetch all events across pages (auto-paginates).
   * Use with caution - can make many requests for large calendars.
   */
  async fetchAllEvents(
    calendarId: string,
    startTime: number,    // epoch ms
    endTime: number,      // epoch ms
    maxPages: number = 5
  ): Promise<CalendarEvent[]> {
    const allEvents: CalendarEvent[] = [];
    let pageToken: string | undefined;
    let page = 0;

    do {
      const response = await this.fetchEvents({
        calendarId,
        startTime: page === 0 ? startTime : undefined,
        endTime: page === 0 ? endTime : undefined,
        pageToken,
      });

      allEvents.push(...response.events);
      pageToken = response.pageToken;
      page++;

      console.log(`[TitanCalendar] Fetched page ${page}: ${response.events.length} events (total: ${allEvents.length})`);
    } while (pageToken && page < maxPages);

    if (pageToken) {
      console.log(`[TitanCalendar] Stopped pagination at ${maxPages} pages. More events available.`);
    }

    return allEvents;
  }

  /**
   * Convenience: Fetch today's events from primary calendar
   */
  async fetchTodayEvents(): Promise<CalendarEvent[]> {
    const primary = await this.getPrimaryCalendar();
    if (!primary) {
      console.warn('[TitanCalendar] No primary calendar found');
      return [];
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

    const { events } = await this.fetchEvents({
      calendarId: primary.calendarId,
      startTime: startOfDay,
      endTime: endOfDay,
    });

    return events;
  }

  /**
   * Convenience: Fetch upcoming events (next N days) from primary calendar
   */
  async fetchUpcomingEvents(days: number = 7): Promise<CalendarEvent[]> {
    const primary = await this.getPrimaryCalendar();
    if (!primary) {
      console.warn('[TitanCalendar] No primary calendar found');
      return [];
    }

    const now = Date.now();
    const endTime = now + days * 24 * 60 * 60 * 1000;

    const { events } = await this.fetchEvents({
      calendarId: primary.calendarId,
      startTime: now,
      endTime: endTime,
    });

    return events;
  }

  /**
   * Clear calendar list cache (call after updates).
   */
  clearCache(): void {
    this.calendarsCache = null;
  }
}

// Export singleton instance
export const titanCalendarProvider = new TitanCalendarProvider();
