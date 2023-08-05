import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';

import { HttpExceptionFilter } from './shared/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn']
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new ValidationPipe());

  app.setGlobalPrefix('api/v1');


  app.enableCors({ origin: true, credentials: true });

  const options = new DocumentBuilder()
    .setTitle('App Explorer')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('explorer', app, document);

  await app.listen(3001);

  Logger.log(
    `** Server is running <GREAT> & everything is under <CTRL>. Happy Coding **`,
  );
}
bootstrap();
