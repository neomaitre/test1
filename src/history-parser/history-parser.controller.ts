import { Controller, Get, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { HistoryParserService } from "./history-parser.service";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller('history-parser')
export class HistoryParserController {
  constructor(private historyParserService: HistoryParserService) {
  }

  @Get()
  retrieveData(): string {
    return 'retrieve'
  }

  @Post('/history')
  @UseInterceptors(FileInterceptor('file'))
  receiveHistory(@UploadedFile() file: Express.Multer.File) {
    return this.historyParserService.handleHistoryFile(file)
  }
}
