import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { defineConfig, TypedConfigModule } from '../src';

abstract class StrictConfig {
  abstract port: number;
  abstract name: string;
}

const strictSchema = z.object({
  STRICT_PORT: z.coerce.number().default(3000),
  STRICT_NAME: z.string().min(1),
});

function makeStrict() {
  return defineConfig({
    name: 'strict',
    token: StrictConfig,
    schema: strictSchema,
    map: (env) => ({
      port: env.STRICT_PORT,
      name: env.STRICT_NAME,
    }),
  });
}

describe('validation (scoped to configs)', () => {
  afterEach(() => {
    delete process.env.STRICT_PORT;
    delete process.env.STRICT_NAME;
  });

  it('should pass when all required env vars are present', async () => {
    process.env.STRICT_NAME = 'myapp';
    process.env.STRICT_PORT = '8080';

    const module = await Test.createTestingModule({
      imports: [TypedConfigModule.forRoot({ configs: [makeStrict()] })],
    }).compile();

    const cfg = module.get(StrictConfig);
    expect(cfg.name).toBe('myapp');
    expect(cfg.port).toBe(8080);

    await module.close();
  });

  it('should pass with defaults for optional vars', async () => {
    process.env.STRICT_NAME = 'myapp';

    const module = await Test.createTestingModule({
      imports: [TypedConfigModule.forRoot({ configs: [makeStrict()] })],
    }).compile();

    const cfg = module.get(StrictConfig);
    expect(cfg.port).toBe(3000);

    await module.close();
  });

  it('should throw when required var is missing', async () => {
    await expect(
      Test.createTestingModule({
        imports: [TypedConfigModule.forRoot({ configs: [makeStrict()] })],
      }).compile(),
    ).rejects.toThrow('Environment validation failed');
  });

  it('should throw on invalid coercion', async () => {
    process.env.STRICT_NAME = 'myapp';
    process.env.STRICT_PORT = 'not-a-number';

    await expect(
      Test.createTestingModule({
        imports: [TypedConfigModule.forRoot({ configs: [makeStrict()] })],
      }).compile(),
    ).rejects.toThrow('Environment validation failed');
  });

  it('should throw when string is empty but min(1) required', async () => {
    process.env.STRICT_NAME = '';

    await expect(
      Test.createTestingModule({
        imports: [TypedConfigModule.forRoot({ configs: [makeStrict()] })],
      }).compile(),
    ).rejects.toThrow('Environment validation failed');
  });

  it('should only validate schemas for the given configs, not others', async () => {
    abstract class OtherConfig {
      abstract secret: string;
    }
    const other = defineConfig({
      name: 'other',
      token: OtherConfig,
      schema: z.object({ OTHER_SECRET: z.string().min(1) }),
      map: (env) => ({ secret: env.OTHER_SECRET }),
    });

    // forRoot with only `strict` should NOT require OTHER_SECRET
    process.env.STRICT_NAME = 'myapp';

    const module = await Test.createTestingModule({
      imports: [TypedConfigModule.forRoot({ configs: [makeStrict()] })],
    }).compile();
    await module.close();

    // forRoot with `other` SHOULD require OTHER_SECRET
    await expect(
      Test.createTestingModule({
        imports: [TypedConfigModule.forRoot({ configs: [other] })],
      }).compile(),
    ).rejects.toThrow('Environment validation failed');
  });
});
