import { Module, Global } from '@nestjs/common';
import { AuthModule } from '../modules/auth/auth.module';
import { JwtInterceptor } from './interceptors/jwt.interceptors';

@Global()
@Module({
  imports: [AuthModule],
  providers: [JwtInterceptor],
  exports: [JwtInterceptor],
})
export class CoreModule {}