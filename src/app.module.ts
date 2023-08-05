import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_FILTER } from '@nestjs/core';
import { join } from "path";

import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { HistoryParserModule } from './history-parser/history-parser.module';
import { DataHandleModule } from './data-handle/data-handle.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),

    MongooseModule.forRoot('mongodb+srv://root:C_Furry_pass@cluster0.kpcuqoe.mongodb.net/'),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/v1/*'],
    }),

    HistoryParserModule,
    DataHandleModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
