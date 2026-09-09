import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { defineConfig, TypedConfigModule } from '../src';

describe('duplicate detection', () => {
  it('should throw on duplicate namespace name', () => {
    abstract class A {
      abstract x: string;
    }
    abstract class B {
      abstract y: string;
    }

    const a = defineConfig({
      name: 'dup',
      token: A,
      schema: z.object({ X: z.string().default('x') }),
      map: (env) => ({ x: env.X }),
    });
    const b = defineConfig({
      name: 'dup', // same name
      token: B,
      schema: z.object({ Y: z.string().default('y') }),
      map: (env) => ({ y: env.Y }),
    });

    expect(() => TypedConfigModule.forRoot({ configs: [a, b] })).toThrow(
      'Duplicate config namespace: "dup"',
    );
  });

  it('should throw on duplicate token', () => {
    abstract class Shared {
      abstract val: string;
    }

    const first = defineConfig({
      name: 'first',
      token: Shared,
      schema: z.object({ A: z.string().default('a') }),
      map: (env) => ({ val: env.A }),
    });
    const second = defineConfig({
      name: 'second',
      token: Shared, // same token
      schema: z.object({ B: z.string().default('b') }),
      map: (env) => ({ val: env.B }),
    });

    expect(() => TypedConfigModule.forRoot({ configs: [first, second] })).toThrow(
      'Duplicate config token: Shared',
    );
  });

  it('should allow same defineConfig result in separate forRoot calls', () => {
    abstract class Cfg {
      abstract v: string;
    }

    const cfg = defineConfig({
      name: 'iso',
      token: Cfg,
      schema: z.object({ V: z.string().default('v') }),
      map: (env) => ({ v: env.V }),
    });

    // Same config in two independent forRoot calls should not throw
    expect(() => TypedConfigModule.forRoot({ configs: [cfg] })).not.toThrow();
    expect(() => TypedConfigModule.forRoot({ configs: [cfg] })).not.toThrow();
  });
});
