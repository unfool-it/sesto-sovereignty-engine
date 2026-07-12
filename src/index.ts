import 'dotenv/config'; // Absolute priority: Initialize environment before schema parsing
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { z } from 'zod';
import { config } from './config/schema.js';
import { logger } from './utils/logger.js';
import { AssetService } from './services/AssetService.js';
import { SovereigntyError } from './utils/errors.js';

const app = express();
const assetService = new AssetService();

// 1. Hardened Security Headers
app.use(helmet());

// 2. High-Performance Observability Integration
app.use(pinoHttp({ logger }));

// 3. Sovereign CORS & Preflight Implementation
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isAllowed = origin && config.ALLOWED_ORIGINS.includes(origin);

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (req.method === 'OPTIONS') {
    if (isAllowed) {
      res.sendStatus(204);
    } else {
      res.status(403).json({
        sovereignty_status: 'REJECTED',
        error: 'OriginNotAllowed',
        message: 'CORS preflight rejected: Origin is not registered within the sovereign perimeter.'
      });
    }
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

app.listen(config.PORT, () => {
  logger.info(`Sovereignty Engine Active: Port ${config.PORT} [${config.NODE_ENV}]`);
});
