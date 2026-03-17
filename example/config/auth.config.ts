import { z } from 'zod';
import { defineConfig } from '../../src';

export abstract class AuthConfig {
  abstract jwtSecret: string;
  abstract jwtExpiresIn: string;
  abstract bcryptRounds: number;
}

export const auth = defineConfig({
  name: 'auth',
  token: AuthConfig,
  schema: z.object({
    JWT_SECRET: z.string().min(1),
    JWT_EXPIRES_IN: z.string().default('7d'),
    BCRYPT_ROUNDS: z.coerce.number().default(10),
  }),
  map: (env) => ({
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
    bcryptRounds: env.BCRYPT_ROUNDS,
  }),
});
