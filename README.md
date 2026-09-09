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
| `node`              | >= 22.12.0 |

NestJS 12 packages are ESM-only. This library ships both CJS and ESM builds, so it works from either module system. A CommonJS app on NestJS 12 relies on Node's `require(esm)`, which is available without flags since Node 22.12 — the same floor as `engines.node`.

## Development

Requires Node 22.12+ and pnpm 12. The `packageManager` field pins the exact pnpm version: any installed pnpm 10+ switches to it automatically, and Corepack works too on Node versions that still ship it (up to 24).

```bash
pnpm install
pnpm test              # typecheck + Vitest
pnpm run test:watch
pnpm run test:cov
pnpm run lint          # Biome
pnpm run typecheck
pnpm run build         # CJS + ESM
pnpm run check:package # publint + are-the-types-wrong
```

CI runs the suite on Node 22/24 × NestJS 11/12 — the lockfile pins NestJS 12 and the 11 leg swaps in `@nestjs/common`/`core`/`testing` 11 with `@nestjs/config` 4, which is that line's release of the config package.

pnpm enforces a 7-day `minimumReleaseAge` supply-chain policy in `pnpm-workspace.yaml`, mirroring the Dependabot cooldown, so a brand-new release will not install until it has settled.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/), enforced by commitlint via a husky hook.

Changelog: [CHANGELOG.md](CHANGELOG.md).

### Releasing

Releases are driven by [release-please](https://github.com/googleapis/release-please). Every push to `main` refreshes a `chore(main): release x.y.z` pull request built from the Conventional Commits since the last tag — `feat` bumps the minor, `fix` the patch, and while the package is below 1.0.0 a `!` / `BREAKING CHANGE` bumps the minor too.

Merging that PR bumps `package.json` and `.release-please-manifest.json`, rewrites `CHANGELOG.md`, and creates the `vX.Y.Z` tag and GitHub release. The publish workflow then runs on that push to `main` and publishes to npm with provenance — it skips versions already on npm, so ordinary merges are no-ops.

With the default `GITHUB_TOKEN` the release PR runs no CI checks, because GitHub does not trigger workflows for PRs that token creates — add a `RELEASE_PLEASE_TOKEN` secret (a PAT with contents + pull-requests write) to fix that.

## License

[MIT](LICENSE)
