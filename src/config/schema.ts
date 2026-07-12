import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.string().transform(Number).default('3000'),
  API_SECRET: z.string().min(32),
  ALLOWED_ORIGINS: z.string()
    .default('http://localhost:3000')
    .transform((val) => val.split(',').map(origin => origin.trim())),
});

export type Env = z.infer<typeof EnvSchema>;
