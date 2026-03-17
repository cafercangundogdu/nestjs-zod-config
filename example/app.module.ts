import { Module } from '@nestjs/common';
import { TypedConfigModule } from '../src';
import { auth, database, redis } from './config';
import { UserService } from './user.service';

@Module({
  imports: [TypedConfigModule.forRoot({ configs: [auth, database, redis] })],
  providers: [UserService],
})
export class AppModule {}
