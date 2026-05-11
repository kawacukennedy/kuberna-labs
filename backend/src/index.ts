import express, { Express } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler.js';
import { defaultTimeout } from './middleware/timeout.js';
import { connectDatabase } from './utils/prisma.js';
import logger from './utils/logger.js';

import { correlationId } from './middleware/correlationId.js';
import { authRouter } from './routes/auth.js';
import { userRouter } from './routes/users.js';
import { courseRouter } from './routes/courses.js';
import { agentRouter } from './routes/agents.js';
import { intentRouter } from './routes/intents.js';
import { paymentRouter } from './routes/payments.js';
import { workshopRouter } from './routes/workshops.js';
import { forumRouter } from './routes/forum.js';
import { notificationRouter } from './routes/notifications.js';
import { analyticsRouter } from './routes/analytics.js';
import { apiKeyRouter } from './routes/apiKeys.js';
import { disputeRouter } from './routes/disputes.js';
import { complianceRouter } from './routes/compliance.js';
import { featureFlagRouter } from './routes/featureFlags.js';

dotenv.config();

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3001',
];

const isProduction = process.env.NODE_ENV === 'production';

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (isProduction) {
      logger.warn('CORS blocked', { origin });
      const error = new Error('CORS policy violation: Origin not allowed');
      return callback(error);
    }

    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY'],
};

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(correlationId);
app.use(defaultTimeout);
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', async (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/courses', courseRouter);
app.use('/api/agents', agentRouter);
app.use('/api/intents', intentRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/workshops', workshopRouter);
app.use('/api/forum', forumRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/api-keys', apiKeyRouter);
app.use('/api/disputes', disputeRouter);
app.use('/api/compliance', complianceRouter);
app.use('/api/feature-flags', featureFlagRouter);

const frontendDistPath = path.resolve(process.env.FRONTEND_DIST_PATH || path.join(__dirname, '../../frontend/out'));
app.use(express.static(frontendDistPath));

app.use('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({
      success: false,
      error: {
        message: 'Route not found',
        code: 'NOT_FOUND',
      },
    });
    return;
  }
  if (req.method !== 'GET') {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).json({
        success: false,
        error: { message: 'Not found', code: 'NOT_FOUND' },
      });
    }
  });
});

app.use(errorHandler);

async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      logger.info(`Kuberna Labs API running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
