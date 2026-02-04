import { ChatRequest } from '../types/protocol';
import { StreamHelper, streamText } from '../utils/stream-helper';
import { findScenario, getDefaultResponse, shouldTriggerError } from './scenarios';

/**
 * Mock agent that simulates LLM responses with streaming
 */
export class MockAgent {
  /**
   * Process a chat request and stream the response
   */
  async processRequest(request: ChatRequest, streamHelper: StreamHelper): Promise<void> {
    try {
      // Get the last user message
      const userMessages = request.messages.filter((m) => m.role === 'user');
      const lastMessage = userMessages[userMessages.length - 1];

      if (!lastMessage) {
        streamHelper.sendError('No user message found', 'VALIDATION_ERROR');
        return;
      }

      // Check if this is a widget action
      if (lastMessage.widgetAction) {
        await this.handleWidgetAction(lastMessage.widgetAction, streamHelper);
        return;
      }

      // Random error simulation (10% chance)
      if (Math.random() < 0.1 || shouldTriggerError(lastMessage.content)) {
        await streamText(streamHelper, 'Let me help you with that... ');
        streamHelper.sendError(
          'Oops! Something went wrong while processing your request. Please try again.',
          'AGENT_ERROR'
        );
        return;
      }

      // Find matching scenario
      const scenario = findScenario(lastMessage.content);
      const response = scenario ? scenario.response : getDefaultResponse();

      // Stream the text response
      await streamText(streamHelper, response.text, 15);

      // Send widgets if any
      if (response.widgets && response.widgets.length > 0) {
        for (const widget of response.widgets) {
          streamHelper.sendWidget(widget);
        }
      }

      // Send done event
      streamHelper.sendDone();
    } catch (error) {
      console.error('Error in mock agent:', error);
      streamHelper.sendError(
        'An unexpected error occurred',
        'AGENT_ERROR'
      );
    }
  }

  /**
   * Handle widget action feedback
   */
  private async handleWidgetAction(
    action: { widgetId: string; actionType: string; actionData: any },
    streamHelper: StreamHelper
  ): Promise<void> {
    const { actionType, actionData } = action;

    // Simulate processing the action
    switch (actionType) {
      case 'reply':
        await streamText(
          streamHelper,
          "I've opened a reply window for this email. What would you like to say?"
        );
        break;

      case 'archive':
        await streamText(streamHelper, 'Email has been archived successfully.');
        break;

      case 'join':
        await streamText(
          streamHelper,
          'Opening the meeting link in your browser. You should see the meeting room shortly.'
        );
        break;

      case 'decline':
        await streamText(
          streamHelper,
          'Meeting declined. I\'ve sent a notification to the organizer.'
        );
        break;

      case 'book':
        await streamText(
          streamHelper,
          'Great choice! To complete the booking, I\'ll need some additional information. Let me create a form for you.'
        );
        // Could send a form widget here
        break;

      case 'submit':
        if (actionData) {
          await streamText(
            streamHelper,
            `Thank you! I've submitted your form with the following details: ${JSON.stringify(actionData, null, 2)}`
          );
        } else {
          await streamText(streamHelper, 'Form submitted successfully!');
        }
        break;

      case 'view_forecast':
        await streamText(
          streamHelper,
          'Here\'s the extended 7-day weather forecast with detailed information...'
        );
        break;

      default:
        await streamText(
          streamHelper,
          `I've processed your "${actionType}" action. Is there anything else I can help you with?`
        );
    }

    streamHelper.sendDone();
  }
}
