// src/config/schema.ts
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.string().transform(Number).default('3000'),
  // Ensure the secret is converted to a usable 32-byte hex string for SecurityUtils
  API_SECRET: z.string().min(32).transform((val) => {
    return Buffer.from(val, 'base64').toString('hex').slice(0, 64);
  }),
  ALLOWED_ORIGINS: z.string().default('*').transform((val) => val.split(',').map((o) => o.trim())),
  ALLOWED_SESTO_KEYS: z
    .string()
    .default('title,body,author,version,metadata')
    .transform((val) => new Set(val.split(',').map((k) => k.trim()))),
  SOVEREIGN_SIGNING_ALGORITHM: z.enum(['sha256', 'sha512']).default('sha256'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export const config = EnvSchema.parse(process.env);
