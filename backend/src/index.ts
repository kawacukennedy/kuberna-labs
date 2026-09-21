import express, { Express } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';

import { errorHandler } from './middleware/errorHandler.js';
import { defaultTimeout } from './middleware/timeout.js';
import { connectDatabase } from './utils/prisma.js';
import logger from './utils/logger.js';
import { localMemory } from './services/localMemory.js';
import { embeddingService } from './services/embeddingService.js';

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
import { intentParserRouter } from './routes/intentParser.js';
import { agentDecisionRouter } from './routes/agentDecision.js';
import { agentOrchestratorRouter } from './routes/agentOrchestrator.js';
import { kiteRouter } from './routes/kite.js';
import { identityRouter } from './routes/identity.js';

dotenv.config();

Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 0.1,
  enabled: !!process.env.SENTRY_DSN,
  integrations: [Sentry.requestDataIntegration()],
});

const isProduction = process.env.NODE_ENV === 'production';

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = (process.env.ALLOWED_ORIGINS || (isProduction ? 'https://kuberna-labs.onrender.com' : 'http://localhost:3000,http://localhost:3001'))
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (origin && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn('CORS blocked', { origin });
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY', 'X-PAYMENT', 'X-PAYMENT-SIGNATURE', 'PAYMENT-REQUIRED'],
};

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://kuberna-labs.onrender.com", "https://api.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com"],
    },
  },
}));
app.use(correlationId);
app.use(defaultTimeout);
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

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
app.use('/api/intents', intentParserRouter);
app.use('/api/agents', agentDecisionRouter);
app.use('/api/agents', agentOrchestratorRouter);
app.use('/api/kite', kiteRouter);
app.use('/api/identity', identityRouter);

const SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://kuberna-labs.onrender.com/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://kuberna-labs.onrender.com/about</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://kuberna-labs.onrender.com/docs</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>https://kuberna-labs.onrender.com/courses</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>https://kuberna-labs.onrender.com/marketplace</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>https://kuberna-labs.onrender.com/careers</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>https://kuberna-labs.onrender.com/enterprise</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://kuberna-labs.onrender.com/privacy</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
</urlset>`;

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send('User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://kuberna-labs.onrender.com/sitemap.xml\n');
});

app.get('/sitemap.xml', (_req, res) => {
  res.type('application/xml').send(SITEMAP_XML);
});

app.get('/favicon.ico', (_req, res) => {
  const faviconPath = path.join(__dirname, '../../frontend/public/favicon.ico');
  if (fs.existsSync(faviconPath)) {
    res.sendFile(faviconPath);
  } else {
    res.status(204).end();
  }
});

const frontendDistPath = path.resolve(process.env.FRONTEND_DIST_PATH || path.join(__dirname, '../../frontend/out'));
if (!fs.existsSync(frontendDistPath)) {
  logger.warn(`Frontend dist path not found: ${frontendDistPath}`);
}
logger.info(`Serving static files from: ${path.resolve(frontendDistPath)}`);
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
  if (/\.[a-z0-9]{2,6}$/i.test(req.path)) {
    res.status(404).json({
      success: false,
      error: { message: 'Not found', code: 'NOT_FOUND' },
    });
    return;
  }
  const indexPath = path.resolve(frontendDistPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    res.status(404).json({
      success: false,
      error: { message: 'Not found', code: 'NOT_FOUND' },
    });
    return;
  }
  res.sendFile(indexPath);
});

Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

async function startServer() {
  try {
    await connectDatabase();
  } catch (error) {
    logger.warn('Database unavailable - starting without DB connection', { error });
  }

  try {
    await embeddingService.initialize();
    await localMemory.initialize();
    logger.info('AI services initialized');
  } catch (error) {
    logger.warn('AI services initialization skipped', { error });
  }

  app.listen(PORT, () => {
    logger.info(`Kuberna Labs API running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
