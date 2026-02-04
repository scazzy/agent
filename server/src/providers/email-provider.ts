/**
 * Mock Email Provider
 * Provides realistic email data for testing
 */

import { DataProvider, Email, EmailSearchQuery } from './types';

// Realistic mock email dataset
const mockEmails: Email[] = [
  // Order confirmations
  {
    id: 'email-001',
    subject: 'Order Confirmation #ORD-2024-78234',
    sender: { name: 'Amazon', email: 'ship-confirm@amazon.com' },
    recipients: [{ name: 'User', email: 'user@example.com' }],
    snippet: 'Your order has been confirmed! Estimated delivery: February 8-10. Order includes: Apple AirPods Pro (2nd Gen), USB-C Charging Cable...',
    body: 'Thank you for your order! Your order #ORD-2024-78234 has been confirmed and will be shipped soon. Estimated delivery: February 8-10, 2024.\n\nOrder Details:\n- Apple AirPods Pro (2nd Gen) - $249.00\n- USB-C Charging Cable - $19.99\n\nTotal: $268.99',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    unread: true,
    hasAttachment: false,
    labels: ['orders', 'shopping'],
  },
  {
    id: 'email-002',
    subject: 'Your package is out for delivery',
    sender: { name: 'UPS', email: 'tracking@ups.com' },
    recipients: [{ name: 'User', email: 'user@example.com' }],
    snippet: 'Good news! Your package is on its way and will be delivered today by 7:00 PM. Track your package: 1Z999AA10123456784',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    unread: true,
    hasAttachment: false,
    labels: ['shipping'],
  },
  // Invoices
  {
    id: 'email-003',
    subject: 'Invoice #INV-2024-0892 from Acme Corp',
    sender: { name: 'Acme Corp Billing', email: 'billing@acmecorp.com' },
    recipients: [{ name: 'User', email: 'user@example.com' }],
    snippet: 'Please find attached invoice #INV-2024-0892 for services rendered in January 2024. Amount due: $4,500.00. Payment due by February 15.',
    body: 'Invoice Details:\n\nInvoice #: INV-2024-0892\nDate: January 31, 2024\nDue Date: February 15, 2024\n\nServices:\n- Consulting Services (40 hours) - $4,000.00\n- Software License - $500.00\n\nTotal Due: $4,500.00\n\nPlease remit payment to...',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    unread: true,
    hasAttachment: true,
    attachments: [{ name: 'INV-2024-0892.pdf', type: 'application/pdf', size: 145000 }],
    labels: ['invoices', 'finance'],
  },
  {
    id: 'email-004',
    subject: 'Receipt for your payment - Netflix',
    sender: { name: 'Netflix', email: 'info@account.netflix.com' },
    recipients: [{ name: 'User', email: 'user@example.com' }],
    snippet: 'Your payment of $22.99 for Premium plan has been processed. Next billing date: March 4, 2024.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    unread: false,
    hasAttachment: false,
    labels: ['receipts', 'subscriptions'],
  },
  // Work emails
  {
    id: 'email-005',
    subject: 'RE: Project Timeline Discussion',
    sender: { name: 'John Smith', email: 'john.smith@company.com' },
    recipients: [{ name: 'User', email: 'user@example.com' }],
    snippet: 'Thanks for the update on the project timeline. I reviewed your proposal and have a few concerns about the Q2 deliverables. Can we discuss tomorrow?',
    body: 'Hi,\n\nThanks for the update on the project timeline. I reviewed your proposal and have a few concerns about the Q2 deliverables.\n\nSpecifically:\n1. The API integration timeline seems aggressive\n2. We may need additional resources for testing\n\nCan we schedule a call tomorrow to discuss?\n\nBest,\nJohn',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    unread: true,
    hasAttachment: false,
    labels: ['work', 'projects'],
    threadId: 'thread-001',
  },
  {
    id: 'email-006',
    subject: 'Weekly Team Update - Feb 3',
    sender: { name: 'Sarah Johnson', email: 'sarah.johnson@company.com' },
    recipients: [{ name: 'User', email: 'user@example.com' }],
    snippet: 'Hi team, Here\'s our weekly update: Sprint 14 completed with 95% velocity. Key achievements: Launched new dashboard, fixed 12 critical bugs...',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    unread: false,
    hasAttachment: true,
    attachments: [{ name: 'Weekly_Report_Feb3.xlsx', type: 'application/vnd.ms-excel', size: 89000 }],
    labels: ['work', 'updates'],
  },
  {
    id: 'email-007',
    subject: 'Meeting Notes: Product Review - Action Items',
    sender: { name: 'Mike Chen', email: 'mike.chen@company.com' },
    recipients: [{ name: 'User', email: 'user@example.com' }],
    snippet: 'Attached are the meeting notes from today\'s product review. Action items for you: 1) Review competitor analysis by Friday 2) Prepare demo for stakeholders...',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    unread: true,
    hasAttachment: true,
    attachments: [{ name: 'Product_Review_Notes.docx', type: 'application/msword', size: 45000 }],
    labels: ['work', 'meetings'],
  },
  // Travel
  {
    id: 'email-008',
    subject: 'Flight Confirmation: NYC → SFO - Feb 15',
    sender: { name: 'United Airlines', email: 'reservations@united.com' },
    recipients: [{ name: 'User', email: 'user@example.com' }],
    snippet: 'Your flight is confirmed! UA 123 departing JFK at 8:00 AM, arriving SFO at 11:30 AM. Confirmation: ABC123. Check-in opens 24 hours before departure.',
    body: 'Flight Confirmation\n\nConfirmation Code: ABC123\n\nFlight: UA 123\nDate: February 15, 2024\nDeparture: JFK 8:00 AM\nArrival: SFO 11:30 AM (local time)\n\nPassenger: User\nSeat: 12A (Window)\n\nCheck-in opens 24 hours before departure.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    unread: false,
    hasAttachment: true,
    attachments: [{ name: 'e-ticket.pdf', type: 'application/pdf', size: 234000 }],
    labels: ['travel', 'flights'],
  },
  {
    id: 'email-009',
    subject: 'Hotel Reservation Confirmed - Marriott San Francisco',
    sender: { name: 'Marriott', email: 'confirmation@marriott.com' },
    recipients: [{ name: 'User', email: 'user@example.com' }],
    snippet: 'Your reservation is confirmed! Check-in: Feb 15, Check-out: Feb 18. Marriott Marquis San Francisco. Confirmation #: MARR789456. Room: King Deluxe.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    unread: false,
    hasAttachment: false,
    labels: ['travel', 'hotels'],
  },
  // Personal
  {
    id: 'email-010',
    subject: 'Happy Birthday! 🎂',
    sender: { name: 'Mom', email: 'mom@family.com' },
    recipients: [{ name: 'User', email: 'user@example.com' }],
    snippet: 'Happy birthday sweetheart! Hope you have an amazing day. Dad and I are so proud of you. Can\'t wait to see you next weekend! Love you! ❤️',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    unread: false,
    hasAttachment: false,
    labels: ['personal', 'family'],
  },
  {
    id: 'email-011',
    subject: 'Dinner plans for Saturday?',
    sender: { name: 'Alex Rivera', email: 'alex.rivera@gmail.com' },
    recipients: [{ name: 'User', email: 'user@example.com' }],
    snippet: 'Hey! Are you free Saturday evening? A bunch of us are planning to check out that new Italian place downtown. Let me know if you can make it!',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    unread: true,
    hasAttachment: false,
    labels: ['personal', 'social'],
  },
  // More work emails
  {
    id: 'email-012',
    subject: 'Quarterly Budget Review - Q1 2024',
    sender: { name: 'Finance Team', email: 'finance@company.com' },
    recipients: [{ name: 'User', email: 'user@example.com' }],
    snippet: 'Please review the attached Q1 2024 budget allocation for your department. Any adjustments need to be submitted by February 10.',
    timestamp: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    unread: true,
    hasAttachment: true,
    attachments: [{ name: 'Q1_2024_Budget.xlsx', type: 'application/vnd.ms-excel', size: 156000 }],
    labels: ['work', 'finance'],
  },
  {
    id: 'email-013',
    subject: 'New Feature Request: Dashboard Analytics',
    sender: { name: 'Product Team', email: 'product@company.com' },
    recipients: [{ name: 'User', email: 'user@example.com' }],
    snippet: 'Based on customer feedback, we\'re proposing a new analytics dashboard feature. Please review the PRD and provide feedback by EOW.',
    timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    unread: false,
    hasAttachment: true,
    attachments: [{ name: 'Analytics_Dashboard_PRD.pdf', type: 'application/pdf', size: 890000 }],
    labels: ['work', 'features'],
  },
  // Newsletters and subscriptions
  {
    id: 'email-014',
    subject: 'This Week in Tech: AI Revolution Continues',
    sender: { name: 'TechCrunch Daily', email: 'newsletter@techcrunch.com' },
    recipients: [{ name: 'User', email: 'user@example.com' }],
    snippet: 'Top stories: OpenAI announces GPT-5, Apple\'s Vision Pro launches to mixed reviews, Google restructures AI division...',
    timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    unread: false,
    hasAttachment: false,
    labels: ['newsletters'],
  },
  {
    id: 'email-015',
    subject: 'Your GitHub notifications digest',
    sender: { name: 'GitHub', email: 'noreply@github.com' },
    recipients: [{ name: 'User', email: 'user@example.com' }],
    snippet: 'You have 5 new notifications: 2 PR reviews requested, 1 issue assigned, 2 mentions in discussions.',
    timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    unread: true,
    hasAttachment: false,
    labels: ['development', 'notifications'],
  },
  // More orders
  {
    id: 'email-016',
    subject: 'Your Uber Eats order is on the way!',
    sender: { name: 'Uber Eats', email: 'noreply@uber.com' },
    recipients: [{ name: 'User', email: 'user@example.com' }],
    snippet: 'Your order from Chipotle is being prepared and will arrive in approximately 25-35 minutes. Track your order in the app.',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    unread: true,
    hasAttachment: false,
    labels: ['orders', 'food'],
  },
  // More work
  {
    id: 'email-017',
    subject: 'Interview Feedback: Senior Developer Candidate',
    sender: { name: 'HR Team', email: 'hr@company.com' },
    recipients: [{ name: 'User', email: 'user@example.com' }],
    snippet: 'Please submit your interview feedback for the Senior Developer position candidate (James Wilson) by end of day today.',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    unread: true,
    hasAttachment: false,
    labels: ['work', 'hiring'],
  },
  {
    id: 'email-018',
    subject: 'Security Alert: New login from unknown device',
    sender: { name: 'Google Security', email: 'no-reply@accounts.google.com' },
    recipients: [{ name: 'User', email: 'user@example.com' }],
    snippet: 'We noticed a new sign-in to your Google Account on a Mac device. If this was you, you can ignore this message.',
    timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    unread: false,
    hasAttachment: false,
    labels: ['security'],
  },
  {
    id: 'email-019',
    subject: 'RE: Vendor Contract Renewal',
    sender: { name: 'Legal Department', email: 'legal@company.com' },
    recipients: [{ name: 'User', email: 'user@example.com' }],
    snippet: 'We\'ve reviewed the vendor contract and have a few suggested amendments. Please see the attached redlined version for review.',
    timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    unread: true,
    hasAttachment: true,
    attachments: [{ name: 'Contract_Redlined.docx', type: 'application/msword', size: 78000 }],
    labels: ['work', 'legal'],
  },
  {
    id: 'email-020',
    subject: 'Reminder: Performance Review Due Feb 10',
    sender: { name: 'HR System', email: 'workday@company.com' },
    recipients: [{ name: 'User', email: 'user@example.com' }],
    snippet: 'This is a reminder that your self-assessment for the annual performance review is due by February 10, 2024.',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    unread: false,
    hasAttachment: false,
    labels: ['work', 'hr'],
  },
  {
    id: 'email-021',
    subject: 'Your AWS bill for January 2024',
    sender: { name: 'Amazon Web Services', email: 'aws-billing@amazon.com' },
    recipients: [{ name: 'User', email: 'user@example.com' }],
    snippet: 'Your AWS charges for January 2024 total $1,247.82. View your detailed bill in the AWS Billing Console.',
    timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    unread: false,
    hasAttachment: true,
    attachments: [{ name: 'AWS_Invoice_Jan2024.pdf', type: 'application/pdf', size: 123000 }],
    labels: ['invoices', 'cloud'],
  },
  {
    id: 'email-022',
    subject: 'Slack: 3 new messages in #engineering',
    sender: { name: 'Slack', email: 'notification@slack.com' },
    recipients: [{ name: 'User', email: 'user@example.com' }],
    snippet: 'You have 3 unread messages in #engineering. Click to view the conversation.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    unread: true,
    hasAttachment: false,
    labels: ['notifications'],
  },
];

export class EmailProvider implements DataProvider<Email, EmailSearchQuery> {
  private emails: Email[];

  constructor(emails?: Email[]) {
    this.emails = emails || mockEmails;
  }

  /**
   * Search emails with various filters
   */
  async search(query: EmailSearchQuery): Promise<Email[]> {
    let results = [...this.emails];

    // Text search across subject, snippet, sender
    if (query.query) {
      const q = query.query.toLowerCase();
      results = results.filter(
        e =>
          e.subject.toLowerCase().includes(q) ||
          e.snippet.toLowerCase().includes(q) ||
          e.sender.name.toLowerCase().includes(q) ||
          e.sender.email.toLowerCase().includes(q) ||
          (e.body && e.body.toLowerCase().includes(q))
      );
    }

    // Filter by sender
    if (query.from) {
      const from = query.from.toLowerCase();
      results = results.filter(
        e =>
          e.sender.name.toLowerCase().includes(from) ||
          e.sender.email.toLowerCase().includes(from)
      );
    }

    // Filter by recipient
    if (query.to) {
      const to = query.to.toLowerCase();
      results = results.filter(e =>
        e.recipients.some(
          r => r.name.toLowerCase().includes(to) || r.email.toLowerCase().includes(to)
        )
      );
    }

    // Filter by subject
    if (query.subject) {
      const subject = query.subject.toLowerCase();
      results = results.filter(e => e.subject.toLowerCase().includes(subject));
    }

    // Filter by date range
    if (query.dateFrom) {
      const fromDate = new Date(query.dateFrom);
      results = results.filter(e => new Date(e.timestamp) >= fromDate);
    }

    if (query.dateTo) {
      const toDate = new Date(query.dateTo);
      results = results.filter(e => new Date(e.timestamp) <= toDate);
    }

    // Filter by attachment
    if (query.hasAttachment !== undefined) {
      results = results.filter(e => e.hasAttachment === query.hasAttachment);
    }

    // Filter by unread status
    if (query.unread !== undefined) {
      results = results.filter(e => e.unread === query.unread);
    }

    // Filter by labels
    if (query.labels && query.labels.length > 0) {
      results = results.filter(e =>
        e.labels?.some(label => query.labels!.includes(label))
      );
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit
    const limit = query.limit || 10;
    return results.slice(0, limit);
  }

  /**
   * Get email by ID
   */
  async getById(id: string): Promise<Email | null> {
    return this.emails.find(e => e.id === id) || null;
  }

  /**
   * Get recent emails
   */
  async getRecent(limit: number): Promise<Email[]> {
    return this.emails
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    return this.emails.filter(e => e.unread).length;
  }

  /**
   * Mark email as read
   */
  async markAsRead(id: string): Promise<boolean> {
    const email = this.emails.find(e => e.id === id);
    if (email) {
      email.unread = false;
      return true;
    }
    return false;
  }
}

export { mockEmails };
