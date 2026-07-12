import pino from 'pino';
import { config } from '../config/schema.js';

const isProduction = config.NODE_ENV === 'production';

export const logger = pino({
  level: config.LOG_LEVEL,
  transport: !isProduction
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  redact: {
    paths: ['req.headers.authorization', 'API_SECRET', 'API_KEY'],
    placeholder: '[REDACTED_SOVEREIGN_DATA]',
  },
});
