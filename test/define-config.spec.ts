import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { defineConfig, TypedConfigModule } from '../src';

// --- Test configs ---

abstract class AppConfig {
  abstract port: number;
  abstract host: string;
}

const app = defineConfig({
  name: 'app',
  token: AppConfig,
  schema: z.object({
    APP_PORT: z.coerce.number().default(3000),
    APP_HOST: z.string().default('localhost'),
  }),
  map: (env) => ({
    port: env.APP_PORT,
    host: env.APP_HOST,
  }),
});

abstract class DatabaseConfig {
  abstract url: string;
  abstract poolSize: number;
}

const database = defineConfig({
  name: 'database',
  token: DatabaseConfig,
  schema: z.object({
    DATABASE_URL: z.string().default('postgres://localhost/test'),
    DATABASE_POOL_SIZE: z.coerce.number().default(5),
  }),
  map: (env) => ({
    url: env.DATABASE_URL,
    poolSize: env.DATABASE_POOL_SIZE,
  }),
});

// --- Tests ---

describe('defineConfig', () => {
  it('should return a ConfigDefinition with name', () => {
    expect(app.name).toBe('app');
    expect(database.name).toBe('database');
  });

  it('should create a namespace with KEY', () => {
    expect(app.namespace.KEY).toBeDefined();
    expect(database.namespace.KEY).toBeDefined();
  });

  it('should create a provider with correct token', () => {
    expect(app.provider.provide).toBe(AppConfig);
    expect(database.provider.provide).toBe(DatabaseConfig);
  });

  it('should have no side effects (no global state)', () => {
    // defineConfig is pure — calling it again creates independent definitions
    const app2 = defineConfig({
      name: 'app2',
      token: AppConfig,
      schema: z.object({ X: z.string().default('y') }),
      map: () => ({ port: 1, host: 'h' }),
    });
    expect(app2.name).toBe('app2');
    expect(app2.namespace.KEY).not.toBe(app.namespace.KEY);
  });
});

describe('TypedConfigModule integration', () => {
  beforeEach(() => {
    process.env.APP_PORT = '8080';
    process.env.APP_HOST = '0.0.0.0';
    process.env.DATABASE_URL = 'postgres://localhost/mydb';
    process.env.DATABASE_POOL_SIZE = '20';
  });

  afterEach(() => {
    delete process.env.APP_PORT;
    delete process.env.APP_HOST;
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_POOL_SIZE;
  });

  it('should inject configs via abstract class tokens', async () => {
    const module = await Test.createTestingModule({
      imports: [TypedConfigModule.forRoot({ configs: [app, database] })],
    }).compile();

    const appConfig = module.get(AppConfig);
    expect(appConfig.port).toBe(8080);
    expect(appConfig.host).toBe('0.0.0.0');

    const dbConfig = module.get(DatabaseConfig);
    expect(dbConfig.url).toBe('postgres://localhost/mydb');
    expect(dbConfig.poolSize).toBe(20);

    await module.close();
  });

  it('should use default values when env vars are not set', async () => {
    delete process.env.APP_PORT;
    delete process.env.APP_HOST;
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_POOL_SIZE;

    const module = await Test.createTestingModule({
      imports: [TypedConfigModule.forRoot({ configs: [app, database] })],
    }).compile();

    const appConfig = module.get(AppConfig);
    expect(appConfig.port).toBe(3000);
    expect(appConfig.host).toBe('localhost');

    const dbConfig = module.get(DatabaseConfig);
    expect(dbConfig.url).toBe('postgres://localhost/test');
    expect(dbConfig.poolSize).toBe(5);

    await module.close();
  });
});
