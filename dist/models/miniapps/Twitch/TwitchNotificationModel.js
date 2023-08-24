"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const remoteDB_1 = __importDefault(require("../../../remoteDB"));
const twitchNotificationSchema = new mongoose_1.Schema({
    createdAt: {
        type: Date,
        default: Date.now,
    },
    sendOut: {
        type: Date,
        required: [true, 'Необходимо указать дату отправки уведомления'],
    },
    title: {
        type: String,
        required: [true, 'Необходимо указать заголовок уведомления'],
    },
    content: {
        type: String,
        required: [true, 'Необходимо указать содержимое уведомления'],
    },
    image: String,
    link: String,
    receivers: [mongoose_1.Schema.Types.ObjectId],
    readBy: [mongoose_1.Schema.Types.ObjectId],
    hiddenFor: [mongoose_1.Schema.Types.ObjectId],
});
const TwitchNotification = remoteDB_1.default.model('th_notifications', twitchNotificationSchema);
exports.default = TwitchNotification;
