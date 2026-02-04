import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  })
);
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', chatRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Agentic Chat Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      chat: 'POST /api/chat',
      health: 'GET /api/health',
    },
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'UNKNOWN_ERROR',
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🤖 Agentic Chat Server               ║
║   📡 Running on http://localhost:${PORT}  ║
║   🔥 Ready to receive requests         ║
╚════════════════════════════════════════╝
  `);
});
