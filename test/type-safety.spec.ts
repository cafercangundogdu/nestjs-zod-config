import { describe, it } from 'vitest';
import { z } from 'zod';
import { defineConfig } from '../src';

abstract class TestCfg {
  abstract host: string;
  abstract port: number;
}

/**
 * Compile-time type safety tests.
 *
 * The @ts-expect-error lines MUST produce TS errors — if TypeScript stops
 * flagging them, the test itself fails, meaning we lost type safety.
 */
describe('compile-time type safety', () => {
  it('accepts correct config definition', () => {
    defineConfig({
      name: 't1',
      token: TestCfg,
      schema: z.object({ HOST: z.string(), PORT: z.coerce.number() }),
      map: (env) => ({ host: env.HOST, port: env.PORT }),
    });
  });

  it('rejects missing property in map return', () => {
    defineConfig({
      name: 't2',
      token: TestCfg,
      schema: z.object({ HOST: z.string() }),
      // @ts-expect-error — missing 'port' property
      map: (env) => ({ host: env.HOST }),
    });
  });

  it('rejects wrong property type in map return', () => {
    defineConfig({
      name: 't3',
      token: TestCfg,
      schema: z.object({ HOST: z.string(), PORT: z.string() }),
      // @ts-expect-error — port is string but should be number
      map: (env) => ({ host: env.HOST, port: env.PORT }),
    });
  });

  it('rejects typo in env var name inside map', () => {
    defineConfig({
      name: 't4',
      token: TestCfg,
      schema: z.object({ HOST: z.string(), PORT: z.coerce.number() }),
      // @ts-expect-error — HOSTT doesn't exist on schema
      map: (env) => ({ host: env.HOSTT, port: env.PORT }),
    });
  });

  it('preserves the correct token type in ConfigDefinition', () => {
    abstract class NumCfg {
      abstract count: number;
    }

    const def = defineConfig({
      name: 't5',
      token: NumCfg,
      schema: z.object({ COUNT: z.coerce.number() }),
      map: (env) => ({ count: env.COUNT }),
    });

    // Provider token is typed as AbstractClass<NumCfg>
    const _check: abstract new (...args: never[]) => NumCfg = def.provider.provide;
    void _check;
  });
});
