import { Types, Schema, model } from 'mongoose';

export interface IMessage {
    relatedTo: Types.ObjectId,
    user: Types.ObjectId,
    content: string,
    readBy: Types.ObjectId[],
    isInformational: boolean,
    createdAt: Date,
}

const messageSchema: Schema<IMessage> = new Schema({
    relatedTo: {
        type: Schema.Types.ObjectId,
        required: [true, 'Сообщение должно быть привязано к чату'],
    },
    user: Schema.Types.ObjectId,
    content: {
        type: String,
        required: [true, 'Сообщение не может быть пустым'],
    },
    readBy: [Schema.Types.ObjectId],
    isInformational: Boolean,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Message = model<IMessage>('chat_message', messageSchema);

export default Message;
