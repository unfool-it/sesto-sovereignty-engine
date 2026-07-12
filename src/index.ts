// File: sesto-sovereignty-engine-main/src/index.ts
import 'dotenv/config'; // Absolute priority: Initialize environment before schema parsing
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

// 1. Hardened Security Headers
app.use(helmet());

// 2. Sovereign Telemetry & Request Logging
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === '/health',
    },
  })
);

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

// Ingestion Schema allows arbitrary properties to pass through so they can be audited and purged
const IngestSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  external_scripts: z.array(z.string()).optional(),
}).passthrough();

app.post('/api/v1/harden', async (req, res, next) => {
  try {
    const validatedBody = IngestSchema.parse(req.body);
    const result = await assetService.hardenAsset(validatedBody);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Sovereign Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OPERATIONAL',
    sovereignty_threshold: 1.0,
    timestamp: new Date().toISOString(),
  });
});

// Production Error Handler & Exception Mapper
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Map Zod validation errors to 400 Bad Request
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

  // Map known operational errors
  if (err instanceof SovereigntyError) {
    logger.error({ err }, 'Sovereignty Operational Fault');
    res.status(err.statusCode).json({
      sovereignty_status: 'COMPROMISED',
      error: err.name,
      message: err.message
    });
    return;
  }

  // Fallback for unhandled system anomalies
  logger.fatal({ err }, 'Unhandled Systemic Catastrophe');
  res.status(500).json({
    sovereignty_status: 'CRITICAL_FAILURE',
    error: 'InternalServerError',
    message: 'An unhandled internal anomaly has occurred.'
  });
});

app.listen(env.PORT, () => {
  logger.info(`Sovereignty Engine Active: Port ${env.PORT} [${env.NODE_ENV}]`);
});
