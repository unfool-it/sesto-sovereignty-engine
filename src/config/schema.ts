import { z } from 'zod';
import dotenv from 'dotenv';

// Hydrate process.env before schema execution
dotenv.config();

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.string().transform(Number).default('3000'),
  API_SECRET: z.string().min(32),
  ALLOWED_ORIGINS: z.string().transform((val) => val.split(',').map((o) => o.trim())),
  ALLOWED_SESTO_KEYS: z
    .string()
    .default('title,body,author,version,metadata')
    .transform((val) => new Set(val.split(',').map((k) => k.trim()))),
  SOVEREIGN_SIGNING_ALGORITHM: z.enum(['sha256', 'sha512']).default('sha256'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = z.infer<typeof EnvSchema>;

export const config = EnvSchema.parse(process.env);
