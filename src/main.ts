import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { JwtInterceptor } from './core/interceptors/jwt.interceptors';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:3000', // or your frontend URL
    credentials: true,
  });
  app.use(cookieParser());
  const jwtInterceptor = app.get(JwtInterceptor);
  app.useGlobalInterceptors(jwtInterceptor);
  await app.listen(3000);
}
bootstrap();
