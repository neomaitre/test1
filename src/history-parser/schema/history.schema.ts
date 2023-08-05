import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type HistoryDocument = HydratedDocument<History>;

@Schema()
export class History {
  @Prop()
  id: string;

  @Prop()
  name: string;
}

export const HistorySchema = SchemaFactory.createForClass(History);
