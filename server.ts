/* eslint-disable import/first */
/* eslint-disable no-console */
/* eslint-disable indent */
import fs from 'fs';
import https from 'https';
import chalk from 'chalk';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config({ path: './config.env' });
import api from './api';
import Application from './models/configurationModel';
import bot from './utils/TelegramBot';

mongoose.connect(process.env.DB_HOST!, {
    authSource: process.env.DB_SOURCE!,
    auth: {
        username: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
    },
}).then(() => console.log(chalk.green('[Датабаза]: Успешное соединение')));

const options = {
    key: fs.readFileSync('./keys/192.168.0.100-key.pem'),
    cert: fs.readFileSync('./keys/192.168.0.100.pem'),
    requestCert: false,
    rejectUnauthorized: false,
};

const server = https.createServer(options, api).listen(process.env.SERVER_PORT || 5000, () => {
    console.log(chalk.green([`[Сервер]: Успешный запуск. Сервер прослушивается на порту: ${process.env.SERVER_PORT || 5000}`]));
});

const shutdownServer = async (stdType: 'exception' | 'rejection') => {
    const app = await Application.findOne({ appId: 1 });
    if (!app) return console.log(chalk.red('[STD]: Невозможно прочитать настройки приложения!'));
    if (app.settings.enableCrashNotifications) {
        new Promise((resolve) => {
            bot.sendMessage(+process.env.TELEGRAM_MY_ID!, 'Критическая ошибка! Приложение было остановлено из за произошедшей ошибки');
            setTimeout(resolve, 800);
        })
        .finally(() => {
            if (stdType === 'exception') process.exit(1);
            if (stdType === 'rejection') server.close(() => process.exit(1));
        });
    } else {
        if (stdType === 'exception') process.exit(1);
        if (stdType === 'rejection') server.close(() => process.exit(1));
    }
};

process.on('uncaughtException', (err) => {
    console.log(chalk.red('UNCAUGHT EXCEPTION! Завершение работы API'), err);
    shutdownServer('exception');
});

process.on('unhandledRejection', (err: { code: string }) => {
    console.log(chalk.red('UNHANDLED REJECTION! Завершение работы API'), err);
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') return console.log('db error');
    shutdownServer('rejection');
});
