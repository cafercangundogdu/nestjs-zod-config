import { z } from 'zod';
import { defineConfig } from '../../src';

export abstract class RedisConfig {
  abstract host: string;
  abstract port: number;
  abstract password: string | undefined;
}

export const redis = defineConfig({
  name: 'redis',
  token: RedisConfig,
  schema: z.object({
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().optional(),
  }),
  map: (env) => ({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  }),
});
