import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.string().transform(Number).default('3000'),
  API_SECRET: z.string().min(32),
  ALLOWED_ORIGINS: z.string().transform((val) => val.split(',').map(s => s.trim())),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = z.infer<typeof EnvSchema>;

// Parse and export a single immutable configuration instance
export const config = EnvSchema.parse(process.env);
