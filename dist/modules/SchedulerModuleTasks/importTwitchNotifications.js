"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const twitchNotificationModel_1 = __importDefault(require("../../models/miniapps/Twitch/twitchNotificationModel"));
const notificationModel_1 = __importDefault(require("../../models/notificationModel"));
exports.default = async () => {
    const twitchNotifications = await twitchNotificationModel_1.default.find().sort({ createdAt: 1 });
    twitchNotifications.map(async (ntf) => {
        await notificationModel_1.default.create({
            ...ntf._doc,
            app: {
                name: 'Twitch Hub',
                icon: 'https://192.168.0.100/site/MiniApps/TwitchStreamers/icon.jpg',
            },
        })
            .catch((err) => console.log('[TASK: Import Twitch Notifications]: Ошибка импортирования уведомления', err));
    });
    await twitchNotificationModel_1.default.deleteMany();
};
