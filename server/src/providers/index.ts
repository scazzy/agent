/**
 * Providers Module Exports
 */

export * from './types';
export { EmailProvider, mockEmails } from './email-provider';
export { TitanMailProvider, titanMailProvider } from './titan-mail-provider';
export type {
  TitanMessage,
  TitanThread,
  TitanFolder,
  Participant,
  FileInfo,
  FetchMessagesParams,
  FetchMessagesResponse,
  SearchParams,
  SearchResponse,
} from './titan-mail-provider';
export { TitanCalendarProvider, titanCalendarProvider, decodeCalendarAttr, decodeCalendarListAttr } from './titan-calendar-provider';
export type {
  TitanCalendar,
  CalendarDetail,
  CalendarEvent as TitanCalendarEvent,
  CalendarReminder,
  CalendarProperties,
  CalendarUpdateRequest,
  CalendarUpdateResponse,
  EventAttendeeInfo,
  FetchEventsRequest,
  FetchEventsResponse,
  FetchEventRequest,
  TitanEventCore,
  TitanEventResponse,
  EventInfo,
  EventLocation,
  EventConference,
  EventPerson,
  EventRecurrence,
  EventReminder,
} from './titan-calendar-provider';