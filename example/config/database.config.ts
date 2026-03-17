import { z } from 'zod';
import { defineConfig } from '../../src';

export abstract class DatabaseConfig {
  abstract url: string;
  abstract poolSize: number;
}

export const database = defineConfig({
  name: 'database',
  token: DatabaseConfig,
  schema: z.object({
    DATABASE_URL: z.string().min(1),
    DATABASE_POOL_SIZE: z.coerce.number().default(10),
  }),
  map: (env) => ({
    url: env.DATABASE_URL,
    poolSize: env.DATABASE_POOL_SIZE,
  }),
});
