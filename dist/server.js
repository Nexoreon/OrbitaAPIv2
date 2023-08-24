"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable import/first */
/* eslint-disable no-console */
/* eslint-disable indent */
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
const chalk_1 = __importDefault(require("chalk"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: './config.env' });
const api_1 = __importDefault(require("./api"));
const configurationModel_1 = __importDefault(require("./models/configurationModel"));
const TelegramBot_1 = __importDefault(require("./utils/TelegramBot"));
mongoose_1.default.connect(process.env.DB_HOST, {
    authSource: process.env.DB_SOURCE,
    auth: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    },
}).then(() => console.log(chalk_1.default.green('[Датабаза]: Успешное соединение')));
const options = {
    key: fs_1.default.readFileSync('./keys/192.168.0.100-key.pem'),
    cert: fs_1.default.readFileSync('./keys/192.168.0.100.pem'),
    requestCert: false,
    rejectUnauthorized: false,
};
const server = https_1.default.createServer(options, api_1.default).listen(process.env.SERVER_PORT || 5000, () => {
    console.log(chalk_1.default.green([`[Сервер]: Успешный запуск. Сервер прослушивается на порту: ${process.env.SERVER_PORT || 5000}`]));
});
const shutdownServer = async (stdType) => {
    const app = await configurationModel_1.default.findOne({ appId: 1 });
    if (!app)
        return console.log(chalk_1.default.red('[STD]: Невозможно прочитать настройки приложения!'));
    if (app.settings.enableCrashNotifications) {
        new Promise((resolve) => {
            TelegramBot_1.default.sendMessage(+process.env.TELEGRAM_MY_ID, 'Критическая ошибка! Приложение было остановлено из за произошедшей ошибки');
            setTimeout(resolve, 800);
        })
            .finally(() => {
            if (stdType === 'exception')
                process.exit(1);
            if (stdType === 'rejection')
                server.close(() => process.exit(1));
        });
    }
    else {
        if (stdType === 'exception')
            process.exit(1);
        if (stdType === 'rejection')
            server.close(() => process.exit(1));
    }
};
process.on('uncaughtException', (err) => {
    console.log(chalk_1.default.red('UNCAUGHT EXCEPTION! Завершение работы API'), err);
    shutdownServer('exception');
});
process.on('unhandledRejection', (err) => {
    console.log(chalk_1.default.red('UNHANDLED REJECTION! Завершение работы API'), err);
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT')
        return console.log('db error');
    shutdownServer('rejection');
});
