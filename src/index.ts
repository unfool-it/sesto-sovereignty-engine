import 'dotenv/config'; 
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { z } from 'zod';
import { EnvSchema } from './config/schema.js';
import { logger } from './utils/logger.js';
import { AssetService } from './services/AssetService.js';
import { SovereigntyError } from './utils/errors.js';

const env = EnvSchema.parse(process.env);
const app = express();
const assetService = new AssetService();

// 1. Structured HTTP Observability
app.use(pinoHttp({ logger }));

// 2. Hardened Security Headers
app.use(helmet());

// 3. Sovereign CORS Implementation
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && env.ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());

const IngestSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  external_scripts: z.array(z.string()).optional()
});

app.post('/api/v1/harden', async (req, res, next) => {
  try {
    const validatedBody = IngestSchema.parse(req.body);
    const result = await assetService.hardenAsset(validatedBody);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Production Error Handler & Exception Mapper
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof z.ZodError) {
    logger.warn({ errors: err.errors }, 'Payload Validation Failure');
    res.status(400).json({
      sovereignty_status: 'REJECTED',
      error: 'ValidationError',
      message: 'The provided payload violates the structural integrity of the Sesto template.',
      details: err.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
    });
    return;
  }

  if (err instanceof SovereigntyError) {
    logger.error({ err }, 'Sovereignty Operational Fault');
    res.status(err.statusCode).json({
      sovereignty_status: 'COMPROMISED',
      error: err.name,
      message: err.message
    });
    return;
  }

  logger.fatal({ err }, 'Unhandled Systemic Catastrophe');
  res.status(500).json({
    sovereignty_status: 'CRITICAL_FAILURE',
    error: 'InternalServerError',
    message: 'An unhandled internal anomaly has occurred.'
  });
});

const server = app.listen(env.PORT, () => {
  logger.info(`Sovereignty Engine Active: Port ${env.PORT} [${env.NODE_ENV}]`);
});

// 4. Process Lifecycle Guards
const gracefulShutdown = (signal: string) => {
  logger.info(`${signal} received. Commencing graceful termination of the Sovereign Core.`);
  server.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.fatal(err, 'UNCAUGHT EXCEPTION DETECTED: Emergency shutdown initiated.');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'UNHANDLED PROMISE REJECTION DETECTED.');
  process.exit(1);
});
