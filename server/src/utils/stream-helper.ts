import { Response } from 'express';
import { StreamEvent, WidgetBlock } from '../types/protocol';

/**
 * Utility to send Server-Sent Events (SSE) to the client
 */
export class StreamHelper {
  private res: Response;
  private closed: boolean = false;

  constructor(res: Response) {
    this.res = res;
    this.setupSSE();
  }

  private setupSSE(): void {
    this.res.setHeader('Content-Type', 'text/event-stream');
    this.res.setHeader('Cache-Control', 'no-cache');
    this.res.setHeader('Connection', 'keep-alive');
    this.res.flushHeaders();
  }

  /**
   * Send an SSE event to the client
   */
  sendEvent(event: StreamEvent): void {
    if (this.closed) {
      return;
    }

    const data = JSON.stringify(event);
    this.res.write(`data: ${data}\n\n`);
  }

  /**
   * Send a text delta event (streaming text chunk)
   */
  sendTextDelta(content: string): void {
    this.sendEvent({ type: 'text_delta', content });
  }

  /**
   * Send a widget event
   */
  sendWidget(widget: WidgetBlock): void {
    this.sendEvent({ type: 'widget', widget });
  }

  /**
   * Send a status event (e.g., "thinking", "searching")
   */
  sendStatus(status: string): void {
    this.sendEvent({ type: 'status', status });
  }

  /**
   * Send a done event (end of stream)
   */
  sendDone(): void {
    this.sendEvent({ type: 'done' });
    this.close();
  }

  /**
   * Send an error event
   */
  sendError(message: string, code: string): void {
    this.sendEvent({
      type: 'error',
      error: { message, code },
    });
    this.close();
  }

  /**
   * Close the stream
   */
  close(): void {
    if (!this.closed) {
      this.closed = true;
      this.res.end();
    }
  }

  /**
   * Check if stream is closed
   */
  isClosed(): boolean {
    return this.closed;
  }
}

/**
 * Sleep utility for simulating delays
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Simulate typing by streaming text with delays
 */
export async function streamText(
  helper: StreamHelper,
  text: string,
  delayPerChar: number = 20
): Promise<void> {
  const words = text.split(' ');

  for (let i = 0; i < words.length; i++) {
    if (helper.isClosed()) {
      break;
    }

    const word = words[i];
    const content = i === words.length - 1 ? word : word + ' ';

    helper.sendTextDelta(content);

    // NOTE: Server-side delays removed to prevent stream timeouts.
    // Text streams instantly. Add client-side delays for typing animation.
  }
}
