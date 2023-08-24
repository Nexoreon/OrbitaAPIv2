"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const conversationSchema = new mongoose_1.Schema({
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
    users: [mongoose_1.Schema.Types.ObjectId],
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
const Conversation = (0, mongoose_1.model)('chat_conversation', conversationSchema);
exports.default = Conversation;
