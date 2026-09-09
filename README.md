# @cafercangundogdu/nestjs-zod-config

[![npm version](https://img.shields.io/npm/v/@cafercangundogdu/nestjs-zod-config.svg)](https://www.npmjs.com/package/@cafercangundogdu/nestjs-zod-config)
[![npm downloads](https://img.shields.io/npm/dm/@cafercangundogdu/nestjs-zod-config.svg)](https://www.npmjs.com/package/@cafercangundogdu/nestjs-zod-config)
[![CI](https://github.com/cafercangundogdu/nestjs-zod-config/actions/workflows/ci.yml/badge.svg)](https://github.com/cafercangundogdu/nestjs-zod-config/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11+%20%7C%2012+-ea2845.svg)](https://nestjs.com/)
[![Zod](https://img.shields.io/badge/Zod-3+%20%7C%204+-3068b7.svg)](https://zod.dev/)

> Type-safe, decorator-free NestJS configuration with Zod validation and plain constructor injection.

## Why?

NestJS configuration typically requires `@Inject()` decorators, string-based keys, or manual `ConfigService.get()` calls — all of which lose type safety or add boilerplate. This library gives you:

- **Plain constructor injection** — no `@Inject()`, no string keys
- **Zod validation at startup** — fail fast with clear error messages
- **Full type safety** — missing properties, wrong types, and env var typos caught at compile time
- **Zero global state** — pure `defineConfig()`, explicit `forRoot({ configs })`
- **Dual ESM/CJS package** — native `import` and `require` entry points, validated with publint and arethetypeswrong

```typescript
@Injectable()
export class UserService {
  constructor(private auth: AuthConfig) {} // fully typed, no decorators

  getSecret() {
    return this.auth.jwtSecret; // string - autocomplete works
  }
}
```

## Install

```bash
pnpm add @cafercangundogdu/nestjs-zod-config
```

Peer dependencies:

```bash
pnpm add @nestjs/common @nestjs/config zod reflect-metadata
```

## Quick start

### 1. Define a config

```typescript
// config/auth.config.ts
import { z } from 'zod';
import { defineConfig } from '@cafercangundogdu/nestjs-zod-config';

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
```

### 2. Register configs in your module

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { TypedConfigModule } from '@cafercangundogdu/nestjs-zod-config';
import { auth } from './config/auth.config';
import { database } from './config/database.config';

@Module({
  imports: [
    TypedConfigModule.forRoot({
      configs: [auth, database],
    }),
  ],
})
export class AppModule {}
```

### 3. Inject with plain constructor injection

```typescript
// user.service.ts
import { Injectable } from '@nestjs/common';
import { AuthConfig } from './config/auth.config';
import { DatabaseConfig } from './config/database.config';

@Injectable()
export class UserService {
  constructor(
    private auth: AuthConfig,
    private db: DatabaseConfig,
  ) {}

  getTokenExpiry() {
    return this.auth.jwtExpiresIn; // string
  }

  getPoolSize() {
    return this.db.poolSize; // number
  }
}
```

No `@Inject()`, no string keys, no decorators. The abstract class serves as both the TypeScript type and the NestJS injection token.

## API

### `defineConfig(options)`

Pure function with no side effects. Returns a `ConfigDefinition` to pass to `TypedConfigModule.forRoot()`.

| Option   | Type             | Description                                          |
| -------- | ---------------- | ---------------------------------------------------- |
| `name`   | `string`         | Unique namespace name for `@nestjs/config` internals |
| `token`  | `abstract class` | Abstract class used as both DI token and type        |
| `schema` | `z.ZodObject`    | Zod schema for env var validation                    |
| `map`    | `(parsed) => T`  | Maps validated env vars to config shape              |

### `TypedConfigModule.forRoot(options)`

| Option            | Type                 | Default | Description                     |
| ----------------- | -------------------- | ------- | ------------------------------- |
| `configs`         | `ConfigDefinition[]` | -       | Config definitions to register  |
| `isGlobal`        | `boolean`            | `true`  | Register as global module       |
| `envFilePath`     | `string \| string[]` | -       | Path to `.env` file(s)          |
| `expandVariables` | `boolean`            | -       | Expand `$VAR` references in env |

Duplicate namespace names or tokens are detected at startup and throw immediately.

## How it works

1. `defineConfig()` creates a Zod schema + NestJS provider pair (pure, no global state)
2. `TypedConfigModule.forRoot({ configs })` receives the definitions explicitly and:
   - Checks for duplicate namespaces/tokens
   - Validates only the given schemas against `process.env` at startup
   - Passes namespaces to `ConfigModule.forRoot({ load: [...] })`
   - Registers providers that bridge `@nestjs/config` namespaces to abstract class tokens
3. At injection time, NestJS resolves the abstract class token to the validated, mapped config object

## Type safety

The generic chain is fully connected with compile-time checks:

| Scenario                        | Caught at   | Mechanism                  |
| ------------------------------- | ----------- | -------------------------- |
| Missing property in `map`       | Compile     | `NoInfer<TConfig>`         |
| Wrong property type in `map`    | Compile     | `NoInfer<TConfig>`         |
| Typo in env var name            | Compile     | `z.infer<ZodObject>`       |
| Invalid env var value           | Startup     | Zod validation             |
| Missing required env var        | Startup     | Zod validation             |
| Duplicate namespace/token       | Startup     | `checkDuplicates()`        |
| Wrong property access on inject | Compile     | Abstract class type        |

## Compatibility

| Dependency          | Supported versions |
| ------------------- | ------------------ |
| `@nestjs/common`    | ^11.0.0 \|\| ^12.0.0 |
| `@nestjs/config`    | ^4.0.0 \|\| ^12.0.0  |
| `zod`               | ^3.20.0 \|\| ^4.0.0  |
| `reflect-metadata`  | ^0.1.13 \|\| ^0.2.0  |
| `typescript`        | >= 5.4 (requires `NoInfer`) |
| `node`              | >= 20 |

NestJS 12 packages are ESM-only. This library ships both CJS and ESM builds, so it works from either module system. A CommonJS app on NestJS 12 relies on Node's `require(esm)`, which is available without flags since Node 20.19 and 22.12.

## License

[MIT](LICENSE)
