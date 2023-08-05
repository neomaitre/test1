import { Document } from 'mongoose';

export interface History extends Document {
  readonly id: string;
  readonly name: string;
}
