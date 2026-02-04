import { Router, Request, Response } from 'express';
import { ChatRequest } from '../types/protocol';
import { MockAgent } from '../mock/agent';
import { Agent } from '../agent';
import { StreamHelper } from '../utils/stream-helper';

const router = Router();

// Configuration: Use mock agent if USE_MOCK_AGENT is set to 'true'
const USE_MOCK = process.env.USE_MOCK_AGENT === 'true';

// Initialize the appropriate agent
const mockAgent = new MockAgent();
const realAgent = USE_MOCK ? null : new Agent({
  llm: {
    model: process.env.LLM_MODEL || 'qwen2.5:7b',
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  },
});

console.log(`🤖 Agent mode: ${USE_MOCK ? 'MOCK' : 'LLM'}`);
if (!USE_MOCK) {
  console.log(`📡 LLM Model: ${process.env.LLM_MODEL || 'qwen2.5:7b'}`);
}

/**
 * POST /api/chat
 * Main chat endpoint with SSE streaming
 */
router.post('/chat', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const chatRequest: ChatRequest = req.body;

    // Validate request
    if (!chatRequest.messages || !Array.isArray(chatRequest.messages)) {
      res.status(400).json({
        error: {
          message: 'Invalid request: messages array is required',
          code: 'VALIDATION_ERROR',
        },
      });
      return;
    }

    // Log request
    console.log('📨 Chat request:', {
      conversationId: chatRequest.conversationId,
      messageCount: chatRequest.messages.length,
      lastMessage: chatRequest.messages[chatRequest.messages.length - 1]?.content?.substring(0, 100),
      mode: USE_MOCK ? 'mock' : 'llm',
    });

    // Setup SSE streaming
    const streamHelper = new StreamHelper(res);

    // Handle client disconnect
    req.on('close', () => {
      console.log('🔌 Client disconnected');
    });

    // Process request with appropriate agent
    if (USE_MOCK || !realAgent) {
      await mockAgent.processRequest(chatRequest, streamHelper);
    } else {
      await realAgent.processRequest(chatRequest, streamHelper);
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Chat request completed in ${duration}ms`);
  } catch (error) {
    console.error('❌ Error in chat endpoint:', error);

    // If headers not sent yet, send error response
    if (!res.headersSent) {
      res.status(500).json({
        error: {
          message: 'Internal server error',
          code: 'UNKNOWN_ERROR',
        },
      });
    }
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  const health: {
    status: string;
    timestamp: string;
    mode: string;
    llm?: { available: boolean; model: string };
    tools?: string[];
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: USE_MOCK ? 'mock' : 'llm',
  };

  // Add LLM status if using real agent
  if (!USE_MOCK && realAgent) {
    try {
      const isAvailable = await realAgent.isAvailable();
      const status = realAgent.getStatus();
      health.llm = {
        available: isAvailable,
        model: status.model,
      };
      health.tools = status.tools;
    } catch (error) {
      health.llm = { available: false, model: 'unknown' };
    }
  }

  res.json(health);
});

/**
 * GET /api/status
 * Detailed agent status
 */
router.get('/status', async (req: Request, res: Response) => {
  if (USE_MOCK || !realAgent) {
    res.json({
      mode: 'mock',
      message: 'Using mock agent - no LLM connection',
    });
    return;
  }

  try {
    const status = realAgent.getStatus();
    const isAvailable = await realAgent.isAvailable();

    res.json({
      mode: 'llm',
      available: isAvailable,
      ...status,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get agent status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
