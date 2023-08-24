"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const chalk_1 = __importDefault(require("chalk"));
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
const common_1 = require("../utils/common");
exports.default = async () => {
    try {
        const delayedNotifications = await notificationModel_1.default.find({ sendOut: { $gte: Date.now() } });
        if (!delayedNotifications.length)
            return console.log(chalk_1.default.blueBright('[Система уведомлений]: Уведомлений для отложенной отправки не найдены'));
        console.log(chalk_1.default.blueBright('[Система уведомлений]: Найдены уведомления для будущей отправки'));
        delayedNotifications.map((ntf) => {
            (0, common_1.sendDelayedNotification)(ntf);
        });
    }
    catch (e) {
        console.log(chalk_1.default.red('[Система уведомлений]: Ошибка планировки отправки уведомлений!'), e);
    }
};
