import 'reflect-metadata';
import { Test } from '@nestjs/testing';

describe('Example App (e2e)', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'super-secret-key';
    process.env.JWT_EXPIRES_IN = '24h';
    process.env.BCRYPT_ROUNDS = '12';
    process.env.DATABASE_URL = 'postgres://localhost/testdb';
    process.env.DATABASE_POOL_SIZE = '15';
    process.env.REDIS_HOST = 'redis.local';
    process.env.REDIS_PORT = '6380';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
    delete process.env.BCRYPT_ROUNDS;
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_POOL_SIZE;
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    jest.resetModules();
  });

  it('should inject all configs into UserService', async () => {
    const { AppModule } = await import('../example/app.module.js');
    const { UserService } = await import('../example/user.service.js');

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const service = module.get(UserService);
    const info = service.getInfo();

    expect(info.jwtSecret).toBe('super-secret-key');
    expect(info.jwtExpiresIn).toBe('24h');
    expect(info.bcryptRounds).toBe(12);
    expect(info.dbUrl).toBe('postgres://localhost/testdb');
    expect(info.dbPoolSize).toBe(15);

    await module.close();
  });

  it('should resolve configs directly from DI container', async () => {
    const { AppModule } = await import('../example/app.module.js');
    const { AuthConfig } = await import('../example/config/auth.config.js');
    const { DatabaseConfig } = await import('../example/config/database.config.js');
    const { RedisConfig } = await import('../example/config/redis.config.js');

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const authCfg = module.get(AuthConfig);
    expect(authCfg.jwtSecret).toBe('super-secret-key');

    const db = module.get(DatabaseConfig);
    expect(db.url).toBe('postgres://localhost/testdb');

    const redis = module.get(RedisConfig);
    expect(redis.host).toBe('redis.local');
    expect(redis.port).toBe(6380);

    await module.close();
  });
});
