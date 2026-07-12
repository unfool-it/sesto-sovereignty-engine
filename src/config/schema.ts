import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.string().transform(Number).default('3000'),
  API_SECRET: z.string().min(32),
  ALLOWED_ORIGINS: z.string().transform((val) => val.split(',')),
});

export type Env = z.infer<typeof EnvSchema>;
