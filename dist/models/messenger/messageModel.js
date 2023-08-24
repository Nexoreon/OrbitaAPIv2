"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    relatedTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: [true, 'Сообщение должно быть привязано к чату'],
    },
    user: mongoose_1.Schema.Types.ObjectId,
    content: {
        type: String,
        required: [true, 'Сообщение не может быть пустым'],
    },
    readBy: [mongoose_1.Schema.Types.ObjectId],
    isInformational: Boolean,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
const Message = (0, mongoose_1.model)('chat_message', messageSchema);
exports.default = Message;
