// File: sesto-sovereignty-engine-main/src/config/schema.ts
import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.string().transform(Number).default('3000'),
  API_SECRET: z.string().min(32),
  ALLOWED_ORIGINS: z.string().transform((val) => val.split(',')),
  // Dynamic Sesto Template: Comma-separated keys transformed into a lookup Set
  ALLOWED_SESTO_KEYS: z
    .string()
    .default('title,body,author,version,metadata')
    .transform((val) => new Set(val.split(',').map((k) => k.trim()))),
  // Cryptographic Signature Algorithm
  SOVEREIGN_SIGNING_ALGORITHM: z.enum(['sha256', 'sha512']).default('sha256'),
});

export type Env = z.infer<typeof EnvSchema>;
