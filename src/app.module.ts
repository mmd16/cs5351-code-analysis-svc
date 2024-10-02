import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { HealthModule } from './modules/health/health.module';
import { OAuthToken } from './modules/auth/oauth-token.entity';
import { User } from './modules/user/user.entity';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from './core/core.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      ...databaseConfig,
      entities: [User, OAuthToken],
    }),
    UserModule,
    AuthModule,
    HealthModule,
    CoreModule,
  ],
})
export class AppModule {}
