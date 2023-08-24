"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const notificationSchema = new mongoose_1.default.Schema({
    createdAt: {
        type: Date,
        default: Date.now,
    },
    sendOut: {
        type: Date,
        required: [true, 'Необходимо указать дату отправки уведомления'],
    },
    app: {
        name: {
            type: String,
            required: [true, 'Необходимо указать название приложения от которого прийдет уведомление'],
        },
        icon: String,
        link: String,
    },
    title: {
        type: String,
        required: [true, 'Необходимо указать заголовок уведомления'],
    },
    content: {
        type: String,
        required: [true, 'Необходимо указать текст уведомления'],
    },
    image: String,
    link: String,
    receivers: [mongoose_1.default.Types.ObjectId],
    readBy: [mongoose_1.default.Types.ObjectId],
    hiddenFor: [mongoose_1.default.Types.ObjectId],
});
const Notification = mongoose_1.default.model('notification', notificationSchema);
exports.default = Notification;
