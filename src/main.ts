import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /*configure swagger*/
  const config = new DocumentBuilder()
  .setTitle('CS5351 Code Analysis')
  .setDescription('API description: Swagger - Backend')
  .setVersion('1.0')
  .addTag('auth')
  .build();

  const document = SwaggerModule.createDocument(app, config);
  //access swagger using hostname:port/api
  //e.g.http://localhost:3000/api
  SwaggerModule.setup('api', app, document);
  /*configure swagger*/

  app.enableCors({
    origin: 'http://localhost:3000', // or your frontend URL
    credentials: true,
  });
  app.use(cookieParser());

  await app.listen(3000);
}
bootstrap();