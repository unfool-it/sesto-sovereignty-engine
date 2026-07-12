// File: sesto-sovereignty-engine-main/src/utils/logger.ts
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
    paths: ['req.headers.authorization', 'body.api_secret'],
    placeholder: '[REDACTED_SOVEREIGN_DATA]',
  },
});
