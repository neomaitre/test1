import { Module } from '@nestjs/common';
import { DataHandleController } from './data-handle.controller';
import { DataHandleService } from './data-handle.service';
import { HistoryTypes } from "../constants/history-constants";

@Module({
  controllers: [DataHandleController],
  providers: [
    DataHandleService,
    HistoryTypes
  ]
})
export class DataHandleModule {}
