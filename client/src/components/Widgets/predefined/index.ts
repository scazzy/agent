/**
 * Predefined Widgets - Export and Register
 */

import { WidgetRegistry } from '../WidgetRegistry';
import { EmailPreviewWidget } from './EmailPreviewWidget';
import { CalendarEventWidget } from './CalendarEventWidget';
import { SearchResultsWidget } from './SearchResultsWidget';
import { FormWidget } from './FormWidget';
import { MeetingCardWidget } from './MeetingCardWidget';
import { FlightCardWidget } from './FlightCardWidget';

// Register all predefined widgets
export function registerPredefinedWidgets() {
  WidgetRegistry.register('email_preview', EmailPreviewWidget);
  WidgetRegistry.register('calendar_event', CalendarEventWidget);
  WidgetRegistry.register('search_results', SearchResultsWidget);
  WidgetRegistry.register('form', FormWidget);
  WidgetRegistry.register('meeting_card', MeetingCardWidget);
  WidgetRegistry.register('flight_card', FlightCardWidget);
}

// Export all widgets
export {
  EmailPreviewWidget,
  CalendarEventWidget,
  SearchResultsWidget,
  FormWidget,
  MeetingCardWidget,
  FlightCardWidget,
};
