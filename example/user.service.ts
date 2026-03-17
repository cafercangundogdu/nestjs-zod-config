import { Injectable } from '@nestjs/common';
import { AuthConfig, DatabaseConfig } from './config';

@Injectable()
export class UserService {
  constructor(
    private auth: AuthConfig,
    private db: DatabaseConfig,
  ) {}

  getInfo() {
    return {
      jwtSecret: this.auth.jwtSecret,
      jwtExpiresIn: this.auth.jwtExpiresIn,
      bcryptRounds: this.auth.bcryptRounds,
      dbUrl: this.db.url,
      dbPoolSize: this.db.poolSize,
    };
  }
}
