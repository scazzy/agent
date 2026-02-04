import { WidgetBlock } from '../types/protocol';
import {
  createEmailWidget,
  createCalendarEventWidget,
  createSearchResultsWidget,
  createFormWidget,
  createMeetingCardWidget,
  createFlightCardWidget,
  createCustomVDOMWidget,
} from './widgets';

/**
 * Mock conversation scenarios with trigger keywords
 */

export interface ScenarioResponse {
  text: string;
  widgets?: WidgetBlock[];
}

export interface Scenario {
  keywords: string[];
  response: ScenarioResponse;
}

export const scenarios: Scenario[] = [
  // Scenario 1: Search Emails
  {
    keywords: ['find emails', 'search emails', 'emails from', 'show emails'],
    response: {
      text: 'I found 3 emails from John regarding the project:',
      widgets: [
        createSearchResultsWidget('emails from john about project', 3),
        createEmailWidget({
          subject: 'RE: Project Timeline Discussion',
          sender: { name: 'John Smith', email: 'john@example.com' },
          snippet:
            'Thanks for the update. I reviewed the timeline and have a few concerns about the Q4 milestones...',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        }),
      ],
    },
  },

  // Scenario 2: Today's Meetings
  {
    keywords: ["what's on my calendar", 'meetings today', 'today schedule', 'calendar today'],
    response: {
      text: 'You have 2 meetings scheduled for today:',
      widgets: [
        createCalendarEventWidget({
          title: 'Daily Standup',
          startTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
          location: 'Virtual - Teams',
          participants: [
            { name: 'Team Lead', email: 'lead@example.com', status: 'accepted' },
            { name: 'Developer 1', email: 'dev1@example.com', status: 'accepted' },
          ],
        }),
        createCalendarEventWidget({
          title: 'Client Presentation',
          startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
          location: 'Conference Room B',
          participants: [
            { name: 'Client Rep', email: 'client@example.com', status: 'tentative' },
            { name: 'Sales Manager', email: 'sales@example.com', status: 'accepted' },
          ],
        }),
      ],
    },
  },

  // Scenario 3: Book Flight
  {
    keywords: ['book flight', 'find flights', 'flight to', 'flights to'],
    response: {
      text: "I found some flight options to London. Here's the best match based on your preferences:",
      widgets: [
        createFlightCardWidget(),
        createFlightCardWidget({
          flightNumber: 'AA 100',
          airline: 'American Airlines',
          departure: {
            airport: 'JFK',
            city: 'New York',
            time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
            terminal: '8',
            gate: 'C15',
          },
          arrival: {
            airport: 'LHR',
            city: 'London',
            time: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000
            ).toISOString(),
            terminal: '3',
            gate: 'B28',
          },
          duration: '7h 15m',
          price: {
            amount: 920,
            currency: 'USD',
          },
          class: 'economy',
        }),
      ],
    },
  },

  // Scenario 4: Fill Form
  {
    keywords: ['expense report', 'file expense', 'submit expense', 'create expense'],
    response: {
      text: 'Sure! Please fill out this expense report form:',
      widgets: [createFormWidget()],
    },
  },

  // Scenario 5: Meeting Details
  {
    keywords: ['meeting details', 'next meeting', 'upcoming meeting', 'show meeting'],
    response: {
      text: "Here's your next scheduled meeting:",
      widgets: [createMeetingCardWidget()],
    },
  },

  // Scenario 6: Custom Widget (Weather)
  {
    keywords: ['weather', 'forecast', 'temperature', 'show weather'],
    response: {
      text: "Here's the current weather forecast for your location:",
      widgets: [createCustomVDOMWidget()],
    },
  },

  // Scenario 7: Multiple Emails
  {
    keywords: ['unread emails', 'new emails', 'recent emails'],
    response: {
      text: 'You have 3 unread emails:',
      widgets: [
        createEmailWidget({
          subject: 'Action Required: Review PR #234',
          sender: { name: 'GitHub', email: 'noreply@github.com' },
          snippet: 'Alice has requested your review on pull request #234...',
        }),
        createEmailWidget({
          subject: 'Invoice #INV-2024-001',
          sender: { name: 'Accounting', email: 'accounting@example.com' },
          snippet: 'Please review and approve the attached invoice for January services...',
        }),
        createEmailWidget({
          subject: 'Team Lunch Tomorrow',
          sender: { name: 'Sarah Manager', email: 'sarah@example.com' },
          snippet: "Don't forget about the team lunch tomorrow at 12:30 PM...",
        }),
      ],
    },
  },
];

/**
 * Find matching scenario based on user message
 */
export function findScenario(message: string): Scenario | null {
  const lowerMessage = message.toLowerCase();

  for (const scenario of scenarios) {
    for (const keyword of scenario.keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        return scenario;
      }
    }
  }

  return null;
}

/**
 * Default fallback response when no scenario matches
 */
export function getDefaultResponse(): ScenarioResponse {
  return {
    text: "I understand you're asking about something, but I don't have a specific response for that yet. Try asking about:\n\n- Finding emails\n- Today's calendar\n- Booking flights\n- Filing expense reports\n- Meeting details\n- Weather forecast",
  };
}

/**
 * Error scenario for testing error handling
 */
export function shouldTriggerError(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return (
    lowerMessage.includes('trigger error') ||
    lowerMessage.includes('cause error') ||
    lowerMessage.includes('test error')
  );
}
