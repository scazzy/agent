/**
 * Mock Calendar Provider
 * Provides realistic calendar event data for testing
 */

import { DataProvider, CalendarEvent, CalendarSearchQuery } from './types';

// Generate dates relative to now
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function setTime(date: Date, hours: number, minutes: number = 0): Date {
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
}

// Realistic mock calendar events
const mockEvents: CalendarEvent[] = [
  // Today's events
  {
    id: 'event-001',
    title: 'Daily Standup',
    description: 'Daily team sync - share updates and blockers',
    startTime: setTime(today, 9, 30).toISOString(),
    endTime: setTime(today, 9, 45).toISOString(),
    location: 'Virtual',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    organizer: { name: 'Sarah Johnson', email: 'sarah.johnson@company.com' },
    attendees: [
      { name: 'User', email: 'user@example.com', status: 'accepted' },
      { name: 'John Smith', email: 'john.smith@company.com', status: 'accepted' },
      { name: 'Mike Chen', email: 'mike.chen@company.com', status: 'accepted' },
      { name: 'Emily Davis', email: 'emily.davis@company.com', status: 'tentative' },
    ],
    isAllDay: false,
  },
  {
    id: 'event-002',
    title: '1:1 with Manager',
    description: 'Weekly check-in with Sarah. Topics: project updates, career development',
    startTime: setTime(today, 11, 0).toISOString(),
    endTime: setTime(today, 11, 30).toISOString(),
    location: 'Sarah\'s Office / Zoom',
    meetingLink: 'https://zoom.us/j/123456789',
    organizer: { name: 'Sarah Johnson', email: 'sarah.johnson@company.com' },
    attendees: [
      { name: 'User', email: 'user@example.com', status: 'accepted' },
      { name: 'Sarah Johnson', email: 'sarah.johnson@company.com', status: 'accepted' },
    ],
    isAllDay: false,
  },
  {
    id: 'event-003',
    title: 'Product Review Meeting',
    description: 'Review Q1 product roadmap and discuss feature prioritization',
    startTime: setTime(today, 14, 0).toISOString(),
    endTime: setTime(today, 15, 0).toISOString(),
    location: 'Conference Room A',
    organizer: { name: 'Product Team', email: 'product@company.com' },
    attendees: [
      { name: 'User', email: 'user@example.com', status: 'accepted' },
      { name: 'Mike Chen', email: 'mike.chen@company.com', status: 'accepted' },
      { name: 'Lisa Wang', email: 'lisa.wang@company.com', status: 'accepted' },
      { name: 'Tom Brown', email: 'tom.brown@company.com', status: 'declined' },
    ],
    isAllDay: false,
  },
  {
    id: 'event-004',
    title: 'Sprint Planning',
    description: 'Plan Sprint 15 - review backlog and assign stories',
    startTime: setTime(today, 16, 0).toISOString(),
    endTime: setTime(today, 17, 30).toISOString(),
    location: 'Virtual - Teams',
    meetingLink: 'https://teams.microsoft.com/l/meetup-join/...',
    organizer: { name: 'John Smith', email: 'john.smith@company.com' },
    attendees: [
      { name: 'User', email: 'user@example.com', status: 'accepted' },
      { name: 'John Smith', email: 'john.smith@company.com', status: 'accepted' },
      { name: 'Emily Davis', email: 'emily.davis@company.com', status: 'accepted' },
      { name: 'Alex Rivera', email: 'alex.rivera@company.com', status: 'accepted' },
    ],
    isAllDay: false,
  },
  // Tomorrow's events
  {
    id: 'event-005',
    title: 'Client Demo: Project Phoenix',
    description: 'Demo new features to Acme Corp stakeholders. Prepare: dashboard, reports, API docs.',
    startTime: setTime(addDays(today, 1), 10, 0).toISOString(),
    endTime: setTime(addDays(today, 1), 11, 30).toISOString(),
    location: 'Virtual - Zoom',
    meetingLink: 'https://zoom.us/j/987654321',
    organizer: { name: 'User', email: 'user@example.com' },
    attendees: [
      { name: 'User', email: 'user@example.com', status: 'accepted' },
      { name: 'Client: Bob Wilson', email: 'bob.wilson@acmecorp.com', status: 'accepted' },
      { name: 'Client: Jane Doe', email: 'jane.doe@acmecorp.com', status: 'accepted' },
      { name: 'Sarah Johnson', email: 'sarah.johnson@company.com', status: 'accepted' },
    ],
    isAllDay: false,
  },
  {
    id: 'event-006',
    title: 'Lunch & Learn: Introduction to AI/ML',
    description: 'Informal session on AI/ML basics. Bring your lunch!',
    startTime: setTime(addDays(today, 1), 12, 0).toISOString(),
    endTime: setTime(addDays(today, 1), 13, 0).toISOString(),
    location: 'Cafeteria / Virtual',
    meetingLink: 'https://meet.google.com/xyz-uvwx-rst',
    organizer: { name: 'Learning & Development', email: 'l&d@company.com' },
    attendees: [
      { name: 'User', email: 'user@example.com', status: 'tentative' },
    ],
    isAllDay: false,
  },
  {
    id: 'event-007',
    title: 'Interview: Senior Developer Candidate',
    description: 'Technical interview with James Wilson. Focus: system design, coding exercise.',
    startTime: setTime(addDays(today, 1), 15, 0).toISOString(),
    endTime: setTime(addDays(today, 1), 16, 0).toISOString(),
    location: 'Interview Room 2',
    organizer: { name: 'HR Team', email: 'hr@company.com' },
    attendees: [
      { name: 'User', email: 'user@example.com', status: 'accepted' },
      { name: 'James Wilson (Candidate)', email: 'james.wilson@email.com', status: 'accepted' },
      { name: 'Mike Chen', email: 'mike.chen@company.com', status: 'accepted' },
    ],
    isAllDay: false,
  },
  // Later this week
  {
    id: 'event-008',
    title: 'Team Offsite Planning',
    description: 'Plan Q2 team offsite event - location, activities, budget',
    startTime: setTime(addDays(today, 2), 14, 0).toISOString(),
    endTime: setTime(addDays(today, 2), 15, 0).toISOString(),
    location: 'Conference Room B',
    organizer: { name: 'Sarah Johnson', email: 'sarah.johnson@company.com' },
    attendees: [
      { name: 'User', email: 'user@example.com', status: 'accepted' },
      { name: 'Sarah Johnson', email: 'sarah.johnson@company.com', status: 'accepted' },
      { name: 'Emily Davis', email: 'emily.davis@company.com', status: 'pending' },
    ],
    isAllDay: false,
  },
  {
    id: 'event-009',
    title: 'Architecture Review Board',
    description: 'Monthly architecture review. Present: microservices migration proposal.',
    startTime: setTime(addDays(today, 3), 10, 0).toISOString(),
    endTime: setTime(addDays(today, 3), 12, 0).toISOString(),
    location: 'Virtual - Teams',
    meetingLink: 'https://teams.microsoft.com/l/meetup-join/...',
    organizer: { name: 'Architecture Team', email: 'architecture@company.com' },
    attendees: [
      { name: 'User', email: 'user@example.com', status: 'accepted' },
      { name: 'Principal Architect', email: 'architect@company.com', status: 'accepted' },
      { name: 'CTO', email: 'cto@company.com', status: 'tentative' },
    ],
    isAllDay: false,
  },
  {
    id: 'event-010',
    title: 'Happy Hour - Team Celebration',
    description: 'Celebrating Sprint 14 completion! Drinks & snacks provided.',
    startTime: setTime(addDays(today, 4), 17, 0).toISOString(),
    endTime: setTime(addDays(today, 4), 19, 0).toISOString(),
    location: 'Rooftop Lounge',
    organizer: { name: 'Sarah Johnson', email: 'sarah.johnson@company.com' },
    attendees: [
      { name: 'User', email: 'user@example.com', status: 'accepted' },
      { name: 'Engineering Team', email: 'engineering@company.com', status: 'accepted' },
    ],
    isAllDay: false,
  },
  // All-day events
  {
    id: 'event-011',
    title: 'Company Holiday - Presidents\' Day',
    description: 'Office closed',
    startTime: setTime(addDays(today, 11), 0, 0).toISOString(),
    endTime: setTime(addDays(today, 11), 23, 59).toISOString(),
    organizer: { name: 'HR', email: 'hr@company.com' },
    attendees: [],
    isAllDay: true,
  },
  // Past events (for reference)
  {
    id: 'event-012',
    title: 'Sprint 14 Retrospective',
    description: 'Team retro - what went well, what to improve',
    startTime: setTime(addDays(today, -1), 15, 0).toISOString(),
    endTime: setTime(addDays(today, -1), 16, 0).toISOString(),
    location: 'Virtual - Zoom',
    organizer: { name: 'John Smith', email: 'john.smith@company.com' },
    attendees: [
      { name: 'User', email: 'user@example.com', status: 'accepted' },
      { name: 'John Smith', email: 'john.smith@company.com', status: 'accepted' },
      { name: 'Emily Davis', email: 'emily.davis@company.com', status: 'accepted' },
    ],
    isAllDay: false,
  },
];

export class CalendarProvider implements DataProvider<CalendarEvent, CalendarSearchQuery> {
  private events: CalendarEvent[];

  constructor(events?: CalendarEvent[]) {
    this.events = events || mockEvents;
  }

  /**
   * Search calendar events with various filters
   */
  async search(query: CalendarSearchQuery): Promise<CalendarEvent[]> {
    let results = [...this.events];

    // Filter by specific date
    if (query.date) {
      const targetDate = this.parseDate(query.date);
      results = results.filter(e => {
        const eventDate = new Date(e.startTime);
        return this.isSameDay(eventDate, targetDate);
      });
    }

    // Filter by date range
    if (query.dateFrom) {
      const fromDate = this.parseDate(query.dateFrom);
      results = results.filter(e => new Date(e.startTime) >= fromDate);
    }

    if (query.dateTo) {
      const toDate = this.parseDate(query.dateTo);
      toDate.setHours(23, 59, 59, 999);
      results = results.filter(e => new Date(e.startTime) <= toDate);
    }

    // Filter by attendee
    if (query.attendee) {
      const attendee = query.attendee.toLowerCase();
      results = results.filter(e =>
        e.attendees.some(
          a =>
            a.name.toLowerCase().includes(attendee) ||
            a.email.toLowerCase().includes(attendee)
        ) ||
        e.organizer.name.toLowerCase().includes(attendee) ||
        e.organizer.email.toLowerCase().includes(attendee)
      );
    }

    // Filter by title
    if (query.title) {
      const title = query.title.toLowerCase();
      results = results.filter(
        e =>
          e.title.toLowerCase().includes(title) ||
          (e.description && e.description.toLowerCase().includes(title))
      );
    }

    // Filter by location
    if (query.location) {
      const location = query.location.toLowerCase();
      results = results.filter(
        e => e.location && e.location.toLowerCase().includes(location)
      );
    }

    // Sort by start time
    results.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    // Apply limit
    const limit = query.limit || 10;
    return results.slice(0, limit);
  }

  /**
   * Get events for a specific date
   */
  async getEventsForDate(date: Date): Promise<CalendarEvent[]> {
    return this.search({ date: date.toISOString() });
  }

  /**
   * Get event by ID
   */
  async getById(id: string): Promise<CalendarEvent | null> {
    return this.events.find(e => e.id === id) || null;
  }

  /**
   * Get recent/upcoming events
   */
  async getRecent(limit: number): Promise<CalendarEvent[]> {
    const now = new Date();
    return this.events
      .filter(e => new Date(e.startTime) >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, limit);
  }

  /**
   * Get today's events
   */
  async getToday(): Promise<CalendarEvent[]> {
    return this.getEventsForDate(new Date());
  }

  /**
   * Check free/busy for a time range
   */
  async getFreeBusy(from: Date, to: Date): Promise<{ busy: boolean; conflicts: CalendarEvent[] }> {
    const conflicts = this.events.filter(e => {
      const eventStart = new Date(e.startTime);
      const eventEnd = new Date(e.endTime);
      return eventStart < to && eventEnd > from;
    });

    return {
      busy: conflicts.length > 0,
      conflicts,
    };
  }

  /**
   * Parse date string (supports "today", "tomorrow", ISO, etc.)
   */
  private parseDate(dateStr: string): Date {
    const lower = dateStr.toLowerCase();

    if (lower === 'today') {
      return new Date();
    }

    if (lower === 'tomorrow') {
      return addDays(new Date(), 1);
    }

    if (lower === 'yesterday') {
      return addDays(new Date(), -1);
    }

    // Handle "next monday", "this friday", etc.
    const dayMatch = lower.match(/^(this|next)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
    if (dayMatch) {
      const isNext = dayMatch[1] === 'next';
      const dayName = dayMatch[2];
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDay = days.indexOf(dayName);
      const today = new Date();
      const currentDay = today.getDay();
      let daysUntil = targetDay - currentDay;

      if (isNext || daysUntil <= 0) {
        daysUntil += 7;
      }

      return addDays(today, daysUntil);
    }

    return new Date(dateStr);
  }

  /**
   * Check if two dates are the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
}

export { mockEvents };
