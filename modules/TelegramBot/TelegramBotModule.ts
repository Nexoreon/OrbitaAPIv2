import { Message } from 'node-telegram-bot-api';
import bot from '../../utils/TelegramBot';
import { handleShowCommands } from './commands';

const myId = +process.env.TELEGRAM_MY_ID!;
bot.setMyCommands([
    { command: '/help', description: 'Показать список команд' },
    { command: '/check_streamers', description: 'Проверить активность отслеживаемых стримеров' },
    { command: '/check_games', description: 'Проверить активность отслеживаемых игр' },
    { command: '/get_latest_report', description: 'Показать последний ежедневный отчёт' },
    { command: '/control_notifications', description: 'Настройка параметров уведомлений' },
], { scope: { type: 'chat', chat_id: myId } });

bot.on('message', async (msg: Message) => {
    const chatId = msg.chat.id;
    const correctId = msg.from!.id === myId;
    if (msg.from!.id !== myId) return bot.sendMessage(chatId, 'https://www.youtube.com/watch?v=7OBx-YwPl8g');

    // Commands
    if (correctId && msg.text === '/help') return handleShowCommands(chatId);
    // if (correctId && msg.text === '/check_streamers') return handleCheckStreamers(chatId);
    // if (correctId && msg.text === '/check_games') return handleCheckGames(chatId);
    // if (correctId && msg.text === '/get_latest_report') return handleGetReport(chatId);
    // if (correctId && msg.text === '/control_notifications') return handleNotifications(chatId);
});

// bot.on('callback_query', async (msg: Message) => {
//     const chatId = msg.chat.id;
//     const correctId = msg.from!.id === myId;
//     if (msg.from!.id !== myId) return bot.sendMessage(chatId, 'https://www.youtube.com/watch?v=7OBx-YwPl8g');
//     return
// });
