import { type ConfigFactory, registerAs } from '@nestjs/config';
import type { z } from 'zod';

// NestJS ConfigObject = Record<string, any>. Abstract class instances are
// assignable to Record<string, any> but NOT to Record<string, unknown>,
// so this one `any` is load-bearing and intentional.

type ConfigObject = Record<string, any>;

type AnyConfigFactory = ReturnType<typeof registerAs<ConfigObject, ConfigFactory<ConfigObject>>>;

type AbstractClass<T> = abstract new (...args: any[]) => T;

export interface ConfigDefinition<TConfig> {
  readonly name: string;
  readonly schema: z.ZodType;
  readonly namespace: AnyConfigFactory;
  readonly provider: {
    readonly provide: AbstractClass<TConfig>;
    readonly useFactory: (cfg: ConfigObject) => TConfig;
    readonly inject: [string | symbol];
  };
}

export interface DefineConfigOptions<TShape extends z.ZodRawShape, TConfig extends ConfigObject> {
  name: string;
  token: AbstractClass<TConfig>;
  schema: z.ZodObject<TShape>;
  map: (parsed: z.infer<z.ZodObject<TShape>>) => NoInfer<TConfig>;
}

export function defineConfig<TShape extends z.ZodRawShape, TConfig extends ConfigObject>(
  options: DefineConfigOptions<TShape, TConfig>,
): ConfigDefinition<TConfig> {
  const { name, token, schema, map } = options;

  const ns = registerAs(name, () => map(schema.parse(process.env) as z.infer<z.ZodObject<TShape>>));

  return {
    name,
    schema,
    namespace: ns as unknown as AnyConfigFactory,
    provider: {
      provide: token,
      inject: [ns.KEY] as [string | symbol],
      useFactory: (cfg: ConfigObject) => cfg as TConfig,
    },
  };
}
