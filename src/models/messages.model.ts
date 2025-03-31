import { Schema, model } from 'mongoose';

export interface IMessage {
  text: string,
  createdAt: string,
  type: string,
  userId: string,
  opened: boolean
}
const messageSchema = new Schema<IMessage>({
  text: { type: String },
  userId: { type: String },
  type: { type: String },
  opened: { type: Boolean, default: false },
  createdAt: { type: String },
})

const Message = model<IMessage>('message', messageSchema);
export default Message 