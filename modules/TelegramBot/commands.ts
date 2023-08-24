/* eslint-disable max-len */
import Configuration from '../../models/configurationModel';
import bot from '../../utils/TelegramBot';

export const handleShowCommands = async (chatId: number) => {
    bot.sendMessage(chatId, `
    /help - Показать список команд 
    /check_streamers - Проверить активность отслеживаемых стримеров
    /check_games - Проверить активность отслеживаемых игр
    /get_latest_report - Показать последний ежедневный отчёт
    /control_notifications - Настройка параметров уведомлений`,
    );
};

export const handleNotifications = async (chatId: number) => {
    const config = await Configuration.findOne({ appId: 1 });
    const { enableCrashNotifications, enableSendingNotifications, enableTGBotNotifications } = config!.settings;
    bot.sendMessage(chatId, `
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
