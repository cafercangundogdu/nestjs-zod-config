import { type DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import type { ConfigDefinition } from './define-config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyConfigDefinition = ConfigDefinition<any>;

export interface TypedConfigModuleOptions {
  configs: AnyConfigDefinition[];
  isGlobal?: boolean;
  envFilePath?: string | string[];
  expandVariables?: boolean;
}

interface ValidationIssue {
  path?: PropertyKey[];
  message: string;
}

function buildValidate(configs: AnyConfigDefinition[]) {
  return (envConfig: Record<string, unknown>) => {
    const errors: ValidationIssue[] = [];

    for (const config of configs) {
      const result = config.schema.safeParse(envConfig);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({ path: issue.path, message: issue.message });
        }
      }
    }

    if (errors.length > 0) {
      const lines = errors.map((i) => `  ${i.path?.join('.') ?? '?'}: ${i.message}`).join('\n');
      throw new Error(`\nEnvironment validation failed:\n${lines}\n`);
    }

    return envConfig;
  };
}

function checkDuplicates(configs: AnyConfigDefinition[]) {
  const names = new Set<string>();
  const tokens = new Set<unknown>();

  for (const config of configs) {
    if (names.has(config.name)) {
      throw new Error(
        `Duplicate config namespace: "${config.name}". Each defineConfig must have a unique name.`,
      );
    }
    if (tokens.has(config.provider.provide)) {
      const tokenName = (config.provider.provide as { name?: string }).name ?? 'unknown';
      throw new Error(
        `Duplicate config token: ${tokenName}. Each defineConfig must use a unique abstract class.`,
      );
    }
    names.add(config.name);
    tokens.add(config.provider.provide);
  }
}

@Module({})
export class TypedConfigModule {
  static forRoot(options: TypedConfigModuleOptions): DynamicModule {
    const { configs, isGlobal = true, ...rest } = options;

    checkDuplicates(configs);

    const namespaces = configs.map((c) => c.namespace);
    const providers = configs.map((c) => c.provider);

    return {
      module: TypedConfigModule,
      global: isGlobal,
      imports: [
        ConfigModule.forRoot({
          validate: buildValidate(configs),
          load: namespaces,
          isGlobal,
          ...rest,
        }),
      ],
      providers,
      exports: providers,
    };
  }
}
