"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const mongoose_1 = __importDefault(require("mongoose"));
const chalk_1 = __importDefault(require("chalk"));
const remoteDB = mongoose_1.default.createConnection(process.env.DB_REMOTE_URL);
remoteDB.on('connected', () => {
    console.log(chalk_1.default.blueBright('[Удалённая датабаза]: Успешное соединение'));
    process.env.REMOTEDB_ONLINE = '1';
});
remoteDB.on('error', (err) => {
    console.log(chalk_1.default.red('[Удалённая датабаза]: Ошибка соединения'), err);
});
remoteDB.on('disconnected', () => {
    console.log(chalk_1.default.blueBright('[Удалённая датабаза]: Соединение закрыто'));
    process.env.REMOTEDB_ONLINE = '0';
});
exports.default = remoteDB;
