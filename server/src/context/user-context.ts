/**
 * User Context Provider
 * Builds dynamic context from user data for system prompts
 */

import { EmailProvider } from '../providers/email-provider';
import { CalendarProvider } from '../providers/calendar-provider';

export interface UserProfile {
  userId: string;
  email: string;
  name?: string;
  timezone: string;
  preferences?: {
    language: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
  };
}

export interface UserContextData {
  currentTime: string;
  timezone: string;
  userEmail: string;
  userName?: string;
  recentActivity?: string;
  upcomingMeetings?: string;
  unreadCount?: number;
}

const defaultProfile: UserProfile = {
  userId: 'user-1',
  email: 'user@example.com',
  name: 'User',
  timezone: 'America/New_York',
  preferences: {
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
  },
};

export class UserContextProvider {
  private emailProvider: EmailProvider;
  private calendarProvider: CalendarProvider;
  private profile: UserProfile;

  constructor(
    emailProvider: EmailProvider,
    calendarProvider: CalendarProvider,
    profile: Partial<UserProfile> = {}
  ) {
    this.emailProvider = emailProvider;
    this.calendarProvider = calendarProvider;
    this.profile = { ...defaultProfile, ...profile };
  }

  /**
   * Build complete user context for system prompt
   */
  async buildContext(): Promise<UserContextData> {
    const now = new Date();

    // Get unread email count
    const unreadEmails = await this.emailProvider.search({ unread: true, limit: 100 });

    // Get today's events
    const todayEvents = await this.calendarProvider.getEventsForDate(now);

    // Get upcoming events (next 2 hours)
    const upcomingEvents = todayEvents.filter(event => {
      const eventStart = new Date(event.startTime);
      const hoursUntil = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursUntil > 0 && hoursUntil <= 2;
    });

    // Format activity summary
    const recentActivity = this.formatRecentActivity(unreadEmails.length, todayEvents.length);

    // Format upcoming meetings
    const upcomingMeetings = upcomingEvents.length > 0
      ? upcomingEvents.map(e => {
          const time = new Date(e.startTime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          });
          return `${e.title} at ${time}`;
        }).join(', ')
      : undefined;

    return {
      currentTime: this.formatDateTime(now),
      timezone: this.profile.timezone,
      userEmail: this.profile.email,
      userName: this.profile.name,
      recentActivity,
      upcomingMeetings,
      unreadCount: unreadEmails.length,
    };
  }

  /**
   * Build minimal context (faster, less data)
   */
  buildMinimalContext(): UserContextData {
    return {
      currentTime: this.formatDateTime(new Date()),
      timezone: this.profile.timezone,
      userEmail: this.profile.email,
      userName: this.profile.name,
    };
  }

  /**
   * Update user profile
   */
  updateProfile(updates: Partial<UserProfile>): void {
    this.profile = { ...this.profile, ...updates };
  }

  /**
   * Get current profile
   */
  getProfile(): UserProfile {
    return { ...this.profile };
  }

  private formatRecentActivity(unreadCount: number, todayEventsCount: number): string {
    const parts: string[] = [];

    if (unreadCount > 0) {
      parts.push(`${unreadCount} unread email${unreadCount !== 1 ? 's' : ''}`);
    }

    if (todayEventsCount > 0) {
      parts.push(`${todayEventsCount} event${todayEventsCount !== 1 ? 's' : ''} today`);
    }

    return parts.length > 0 ? parts.join(', ') : 'No recent activity';
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  }
}
