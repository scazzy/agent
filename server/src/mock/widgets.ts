import {
  WidgetBlock,
  EmailPreviewData,
  CalendarEventData,
  SearchResultsData,
  FormWidgetData,
  MeetingCardData,
  FlightCardData,
} from '../types/protocol';

/**
 * Mock widget data generators
 */

export function createEmailWidget(data: Partial<EmailPreviewData> = {}): WidgetBlock {
  const emailData: EmailPreviewData = {
    subject: data.subject || 'Q4 Project Update - Action Required',
    sender: data.sender || {
      name: 'John Smith',
      email: 'john.smith@example.com',
    },
    snippet:
      data.snippet ||
      'Hi team, I wanted to follow up on the Q4 project milestones. We need to finalize the requirements by end of week...',
    timestamp: data.timestamp || new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    unread: data.unread ?? true,
  };

  return {
    id: `email-${Date.now()}-${Math.random()}`,
    type: 'email_preview',
    data: emailData,
    actions: [
      { id: 'reply', label: 'Reply', type: 'button', variant: 'primary' },
      { id: 'archive', label: 'Archive', type: 'button', variant: 'default' },
      { id: 'open', label: 'Open', type: 'link' },
    ],
  };
}

export function createCalendarEventWidget(
  data: Partial<CalendarEventData> = {}
): WidgetBlock {
  const eventData: CalendarEventData = {
    title: data.title || 'Sprint Planning Meeting',
    startTime: data.startTime || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    endTime: data.endTime || new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    location: data.location || 'Conference Room A',
    participants: data.participants || [
      { name: 'Alice Johnson', email: 'alice@example.com', status: 'accepted' },
      { name: 'Bob Wilson', email: 'bob@example.com', status: 'tentative' },
      { name: 'Carol Davis', email: 'carol@example.com', status: 'accepted' },
    ],
    meetingLink: data.meetingLink || 'https://meet.example.com/sprint-planning',
    description: data.description || 'Review last sprint and plan upcoming tasks',
  };

  return {
    id: `calendar-${Date.now()}-${Math.random()}`,
    type: 'calendar_event',
    data: eventData,
    actions: [
      { id: 'join', label: 'Join Meeting', type: 'button', variant: 'primary' },
      { id: 'decline', label: 'Decline', type: 'button', variant: 'default' },
      { id: 'details', label: 'View Details', type: 'link' },
    ],
  };
}

export function createSearchResultsWidget(
  query: string,
  resultCount: number = 3
): WidgetBlock {
  const results = [];

  for (let i = 0; i < resultCount; i++) {
    results.push({
      id: `result-${i}`,
      title: `Email: Project Update ${i + 1}`,
      snippet: `This email discusses important updates about the project status and next steps...`,
      type: 'email' as const,
      timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        from: `user${i}@example.com`,
        hasAttachment: i % 2 === 0,
      },
    });
  }

  const searchData: SearchResultsData = {
    query,
    results,
    totalCount: resultCount,
  };

  return {
    id: `search-${Date.now()}-${Math.random()}`,
    type: 'search_results',
    data: searchData,
    actions: [
      { id: 'view_all', label: 'View All Results', type: 'link' },
      { id: 'refine', label: 'Refine Search', type: 'button', variant: 'default' },
    ],
  };
}

export function createFormWidget(data: Partial<FormWidgetData> = {}): WidgetBlock {
  const formData: FormWidgetData = {
    title: data.title || 'Expense Report',
    description: data.description || 'Please fill out the details for your expense claim',
    fields: data.fields || [
      {
        id: 'amount',
        label: 'Amount',
        type: 'number',
        required: true,
        placeholder: '0.00',
        validation: {
          min: 0,
          message: 'Amount must be positive',
        },
      },
      {
        id: 'category',
        label: 'Category',
        type: 'select',
        required: true,
        options: [
          { label: 'Travel', value: 'travel' },
          { label: 'Meals', value: 'meals' },
          { label: 'Equipment', value: 'equipment' },
          { label: 'Other', value: 'other' },
        ],
      },
      {
        id: 'date',
        label: 'Date',
        type: 'date',
        required: true,
      },
      {
        id: 'description',
        label: 'Description',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the expense...',
      },
    ],
    submitLabel: data.submitLabel || 'Submit Report',
  };

  return {
    id: `form-${Date.now()}-${Math.random()}`,
    type: 'form',
    data: formData,
    actions: [
      { id: 'submit', label: 'Submit', type: 'form', variant: 'primary' },
      { id: 'cancel', label: 'Cancel', type: 'button', variant: 'default' },
    ],
  };
}

export function createMeetingCardWidget(data: Partial<MeetingCardData> = {}): WidgetBlock {
  const meetingData: MeetingCardData = {
    title: data.title || 'Product Roadmap Review',
    startTime: data.startTime || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    endTime: data.endTime || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    location: data.location || 'Virtual - Zoom',
    attendees: data.attendees || [
      {
        name: 'Sarah Chen',
        email: 'sarah@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      },
      {
        name: 'Mike Torres',
        email: 'mike@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
      },
      {
        name: 'Emma Wilson',
        email: 'emma@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
      },
    ],
    agenda: data.agenda || [
      'Review Q1 achievements',
      'Discuss Q2 priorities',
      'Technical debt assessment',
      'Resource allocation',
    ],
    meetingLink: data.meetingLink || 'https://zoom.us/j/123456789',
    organizer: data.organizer || {
      name: 'David Park',
      email: 'david@example.com',
    },
  };

  return {
    id: `meeting-${Date.now()}-${Math.random()}`,
    type: 'meeting_card',
    data: meetingData,
    actions: [
      { id: 'join', label: 'Join Meeting', type: 'button', variant: 'primary' },
      { id: 'add_to_calendar', label: 'Add to Calendar', type: 'button', variant: 'default' },
      { id: 'view_agenda', label: 'Full Agenda', type: 'link' },
    ],
  };
}

export function createFlightCardWidget(data: Partial<FlightCardData> = {}): WidgetBlock {
  const flightData: FlightCardData = {
    flightNumber: data.flightNumber || 'BA 117',
    airline: data.airline || 'British Airways',
    departure: data.departure || {
      airport: 'JFK',
      city: 'New York',
      time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      terminal: '7',
      gate: 'B22',
    },
    arrival: data.arrival || {
      airport: 'LHR',
      city: 'London',
      time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000).toISOString(),
      terminal: '5',
      gate: 'A15',
    },
    duration: data.duration || '7h 00m',
    price: data.price || {
      amount: 850,
      currency: 'USD',
    },
    class: data.class || 'economy',
    stops: data.stops ?? 0,
  };

  return {
    id: `flight-${Date.now()}-${Math.random()}`,
    type: 'flight_card',
    data: flightData,
    actions: [
      { id: 'book', label: 'Book Now', type: 'button', variant: 'primary' },
      { id: 'details', label: 'Flight Details', type: 'link' },
      { id: 'compare', label: 'Compare Prices', type: 'button', variant: 'default' },
    ],
  };
}

export function createCustomVDOMWidget(): WidgetBlock {
  return {
    id: `custom-${Date.now()}-${Math.random()}`,
    type: 'custom',
    data: {},
    vdom: {
      component: 'Card',
      props: {
        title: 'Weather Forecast',
        bordered: true,
        style: { width: '100%' },
      },
      children: [
        {
          component: 'Flex',
          props: { vertical: true, gap: 'middle' },
          children: [
            {
              component: 'Flex',
              props: { justify: 'space-between', align: 'center' },
              children: [
                {
                  component: 'Text',
                  props: { style: { fontSize: '48px' } },
                  children: ['🌤️'],
                },
                {
                  component: 'Flex',
                  props: { vertical: true, align: 'end' },
                  children: [
                    {
                      component: 'Text',
                      props: { strong: true, style: { fontSize: '32px' } },
                      children: ['72°F'],
                    },
                    {
                      component: 'Text',
                      props: { type: 'secondary' },
                      children: ['Partly Cloudy'],
                    },
                  ],
                },
              ],
            },
            {
              component: 'Divider',
              props: { style: { margin: '12px 0' } },
            },
            {
              component: 'Flex',
              props: { justify: 'space-around' },
              children: [
                {
                  component: 'Flex',
                  props: { vertical: true, align: 'center', gap: 'small' },
                  children: [
                    { component: 'Text', props: { type: 'secondary' }, children: ['Mon'] },
                    { component: 'Text', children: ['☀️'] },
                    { component: 'Text', props: { strong: true }, children: ['75°'] },
                  ],
                },
                {
                  component: 'Flex',
                  props: { vertical: true, align: 'center', gap: 'small' },
                  children: [
                    { component: 'Text', props: { type: 'secondary' }, children: ['Tue'] },
                    { component: 'Text', children: ['🌧️'] },
                    { component: 'Text', props: { strong: true }, children: ['68°'] },
                  ],
                },
                {
                  component: 'Flex',
                  props: { vertical: true, align: 'center', gap: 'small' },
                  children: [
                    { component: 'Text', props: { type: 'secondary' }, children: ['Wed'] },
                    { component: 'Text', children: ['⛈️'] },
                    { component: 'Text', props: { strong: true }, children: ['65°'] },
                  ],
                },
              ],
            },
            {
              component: 'Button',
              props: {
                type: 'primary',
                block: true,
                action: 'view_forecast',
              },
              children: ['View 7-Day Forecast'],
            },
          ],
        },
      ],
    },
  };
}
