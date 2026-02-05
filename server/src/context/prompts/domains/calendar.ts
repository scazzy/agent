/**
 * Calendar Domain Prompt
 * Loaded when the user's query is about calendar/meetings/events.
 * Contains tool usage guidance, date handling, and pagination instructions.
 */

export const calendarDomainPrompt = {
  domain: 'calendar' as const,

  keywords: [
    'calendar', 'meeting', 'meetings', 'event', 'events', 'schedule',
    'appointment', 'appointments', 'busy', 'free', 'available', 'availability',
    'today', 'tomorrow', 'this week', 'next week',
    'book', 'schedule', 'reschedule', 'cancel',
    'attendee', 'attendees', 'invite', 'invitation',
    'agenda', 'time', 'slot', 'when',
  ],

  instructions: `## Calendar Tools Guide

### Use \`fetch_calendar_list\` when:
- User asks "which calendars do I have", "show my calendars", "list calendars"
- You need to find the correct calendarId before fetching events
- User asks about calendar settings, colors, or visibility

### Use \`fetch_calendar\` when:
- User asks for details about a specific calendar (summary, description, timezone)
- You already have a calendarId and need its metadata

### Use \`fetch_calendar_events\` when:
- User asks about their schedule, meetings, or events
- User wants to see what's on their calendar for a day/week
- Examples: "what's on my calendar today", "any meetings this week", "show my events"
- If no calendarId is specified, this uses the primary calendar automatically
- For date ranges, provide startTime and endTime in ISO 8601 format
- Results are paginated - use pageToken for more results if hasMore is true

### Use \`update_calendar\` when:
- User wants to hide/show a calendar
- User wants to change calendar color
- Examples: "hide the team calendar", "change calendar color to blue"

## Calendar Tool Decision Tree

**Step 1: Does user want to see calendars or events?**
- Calendars → \`fetch_calendar_list\`
- Events → \`fetch_calendar_events\`
- Specific calendar details → \`fetch_calendar\`

**Step 2: For events, does user specify a calendar?**
- YES → Use that calendarId in \`fetch_calendar_events\`
- NO → \`fetch_calendar_events\` will use the primary calendar automatically

**Step 3: For events, does user specify a date range?**
- "today" → Set startTime to today 00:00 and endTime to today 23:59
- "tomorrow" → Set startTime/endTime accordingly
- "this week" → Set startTime to Monday and endTime to Sunday
- No date → Omit startTime/endTime to get upcoming events

## Calendar Summary Format

For summaries, structure like:

"Here's your schedule for [date]:

• **9:00 AM - 10:00 AM**: Team Standup (Zoom)
• **2:00 PM - 3:00 PM**: 1:1 with Sarah (Room 301)
• **4:00 PM - 4:30 PM**: Quick sync with Design team

You have 3 meetings totaling 2.5 hours. Free slots: 10am-2pm, 3pm-4pm."

- List chronologically
- Include time, title, location
- Mention total meeting time
- Note free slots if relevant

## Pagination
Events are paginated. If the response includes hasMore: true and a nextPageToken, and the user needs more events, call \`fetch_calendar_events\` again with the pageToken.`,
};
