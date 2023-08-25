import { Types, Schema, model } from 'mongoose';

export interface IConversation {
    title: string;
    subtitle: string;
    image: string;
    icon: {
        type: string;
        name: string;
    };
    users: Types.ObjectId[];
    type: 'messages' | 'notifications';
    api: string;
    flags: {
        available: boolean;
        restrictMessages: boolean;
    };
    createdAt: Date;
}

const conversationSchema: Schema<IConversation> = new Schema({
    title: {
        type: String,
        required: [true, 'Укажите имя чата'],
    },
    subtitle: String,
    image: String,
    icon: {
        type: {
            type: String,
            default: 'far',
        },
        name: String,
    },
    users: [Schema.Types.ObjectId],
    type: {
        type: String,
        enum: ['messages', 'notifications'],
        default: 'messages',
    },
    api: String,
    flags: {
        available: {
            type: Boolean,
            default: true,
        },
        restrictMessages: {
            type: Boolean,
            default: false,
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Conversation = model<IConversation>('chat_conversation', conversationSchema);

export default Conversation;
