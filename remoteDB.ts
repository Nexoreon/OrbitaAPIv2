/* eslint-disable no-console */
import mongoose from 'mongoose';
import chalk from 'chalk';

const remoteDB = mongoose.createConnection(process.env.DB_REMOTE_URL!);

remoteDB.on('connected', () => {
    console.log(chalk.blueBright('[Удалённая датабаза]: Успешное соединение'));
    process.env.REMOTEDB_ONLINE = '1';
});

remoteDB.on('error', (err: object) => {
    console.log(chalk.red('[Удалённая датабаза]: Ошибка соединения'), err);
});

remoteDB.on('disconnected', () => {
    console.log(chalk.blueBright('[Удалённая датабаза]: Соединение закрыто'));
    process.env.REMOTEDB_ONLINE = '0';
});

export default remoteDB;
