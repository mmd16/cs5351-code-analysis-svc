import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { HealthModule } from './modules/health/health.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CoreModule } from './core/core.module';
import { TokenModule } from './modules/token/token.module';
import { OauthAccountInfoModule } from './modules/oauth-account-info/oauth-account-info.module';
import { Token } from './modules/token/token.entity';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        configService.get('database'),
      inject: [ConfigService],
    }),
    // TypeOrmModule.forRoot({
    //   ...databaseConfig,
    //   entities: [User, Token, OauthAccountInfoModule],
    // }),
    UserModule,
    AuthModule,
    HealthModule,
    CoreModule,
    TokenModule,
    OauthAccountInfoModule,
  ],
})
export class AppModule {}
