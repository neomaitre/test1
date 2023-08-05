import { Module } from '@nestjs/common';
import { HistoryParserController } from './history-parser.controller';
import { HistoryParserService } from './history-parser.service';
import { DataHandleService } from "../data-handle/data-handle.service";
import { HistoryTypes } from "../constants/history-constants";
import { HistorySchema } from "./schema/history.schema";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'History', schema: HistorySchema }])
  ],
  controllers: [
    HistoryParserController
  ],
  providers: [
    HistoryParserService,
    DataHandleService,
    HistoryTypes
  ]
})
export class HistoryParserModule {}
