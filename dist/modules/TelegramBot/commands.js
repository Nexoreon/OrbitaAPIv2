"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleNotifications = exports.handleShowCommands = void 0;
/* eslint-disable max-len */
const configurationModel_1 = __importDefault(require("../../models/configurationModel"));
const TelegramBot_1 = __importDefault(require("../../utils/TelegramBot"));
const handleShowCommands = async (chatId) => {
    TelegramBot_1.default.sendMessage(chatId, `
    /help - Показать список команд 
    /check_streamers - Проверить активность отслеживаемых стримеров
    /check_games - Проверить активность отслеживаемых игр
    /get_latest_report - Показать последний ежедневный отчёт
    /control_notifications - Настройка параметров уведомлений`);
};
exports.handleShowCommands = handleShowCommands;
const handleNotifications = async (chatId) => {
    const config = await configurationModel_1.default.findOne({ appId: 1 });
    const { enableCrashNotifications, enableSendingNotifications, enableTGBotNotifications } = config.settings;
    TelegramBot_1.default.sendMessage(chatId, `
    Telegram уведомления: ${enableTGBotNotifications ? '🟩' : '🟥'}
    Push уведомления: ${enableSendingNotifications ? '🟩' : '🟥'}
    Уведомление о краше приложения: ${enableCrashNotifications ? '🟩' : '🟥'}
        `, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{ text: `${enableTGBotNotifications ? 'Выключить' : 'Включить'} уведомления в Telegram`, callback_data: '/settings_notifications_tg' }],
                [
                    { text: `${enableSendingNotifications ? 'Выключить' : 'Включить'} push уведомления`, callback_data: '/settings_notifications_push' },
                    { text: `${enableCrashNotifications ? 'Выключить' : 'Включить'} уведомление о краше приложения`, callback_data: '/settings_notifications_crash' },
                ],
            ],
        },
    });
};
exports.handleNotifications = handleNotifications;
