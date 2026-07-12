// File: sesto-sovereignty-engine-main/src/utils/logger.ts
import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
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
