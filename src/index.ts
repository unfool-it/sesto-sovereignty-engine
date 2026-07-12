import express from 'express';
import helmet from 'helmet';
import { z } from 'zod';
import { EnvSchema } from './config/schema.js';
import { logger } from './utils/logger.js';
import { AssetService } from './services/AssetService.js';
import { SovereigntyError } from './utils/errors.js';

const env = EnvSchema.parse(process.env);
const app = express();
const assetService = new AssetService();

app.use(helmet());
app.use(express.json());

const IngestSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  external_scripts: z.array(z.string()).optional()
});

app.post('/api/v1/harden', async (req, res, next) => {
  const controller = new AbortController();
  
  try {
    const validatedBody = IngestSchema.parse(req.body);
    const result = await assetService.hardenAsset(validatedBody, controller.signal);
    
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Production Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = err instanceof SovereigntyError ? err.statusCode : 500;
  logger.error({ err }, 'Operational Fault');
  
  res.status(status).json({
    sovereignty_status: 'COMPROMISED',
    error: err.name,
    message: err.message
  });
});

app.listen(env.PORT, () => {
  logger.info(`Sovereignty Engine Active: Port ${env.PORT} [${env.NODE_ENV}]`);
});
