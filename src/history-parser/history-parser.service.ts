import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { CreateHistoryDto } from "./dto/create-history.dto";
import { DataHandleService } from "../data-handle/data-handle.service";
import { HistoryTypes } from "../constants/history-constants";
import { History } from "./history-parser.interface";

@Injectable()
export class HistoryParserService {
  constructor(
    private readonly fileService: DataHandleService,
    @Inject(HistoryTypes) private readonly constants: HistoryTypes,
    @InjectModel('History') private historyModel: Model<History>
  ) {}

  save(history: CreateHistoryDto): CreateHistoryDto {
    return history
  }

  handleHistoryFile(file: Express.Multer.File) {
    const fileContent = file.buffer.toString()
    const sections: string[] = fileContent.split(/\n\s*\n/);
    const fileType = this.fileService.validateFileType(sections)

    let data

    switch (fileType) {
      case this.constants.poker888:
        data = this.fileService.eightPokerParser(sections)
        break
      case this.constants.pokerStars:
        data = this.fileService.pokerStarParser(sections)
        break
      default:
        break
    }

    console.log('---data---', data)

    const newHistoryData = new this.historyModel({ id: '111', name: 'db test' })
    newHistoryData.save()
      .then((result: any) => {
        console.log('---saved data---', result)
      })
      .catch((err: any) => {
        console.log('---db save err---', err)
      })

    return data
  }
}
