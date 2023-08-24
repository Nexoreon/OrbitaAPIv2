"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
/* eslint-disable camelcase */
const chalk_1 = __importDefault(require("chalk"));
const qs_1 = __importDefault(require("qs"));
const axios_1 = __importDefault(require("axios"));
const configurationModel_1 = __importDefault(require("../../models/configurationModel"));
const getToken = async () => {
    console.log(chalk_1.default.green('[Spotify Library]: Запуск проверки актуальности токена...'));
    const config = await configurationModel_1.default.findOne({ appId: 3 });
    if (!config)
        return console.log(chalk_1.default.red('[Spotify Library]: Ошибка обнаружения параметров приложения!'));
    const tokenExpiresIn = +config.settings.tokenExpiresIn;
    const tokenExpired = tokenExpiresIn && tokenExpiresIn < new Date().getTime();
    if (tokenExpired) {
        console.log(chalk_1.default.green('[Spotify Library]: Текущий токен истёк. Получение нового токена...'));
        return getAuthToken(config.settings.refreshToken);
    }
    console.log(chalk_1.default.green('[Spotify Library]: Токен актуален, обновление не требуется'));
};
const getAuthToken = async (refreshToken) => {
    const data = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
    };
    // Ключ авторизации. клиент id + секрет id конвертированный в base64 код
    const response = await axios_1.default.post('https://accounts.spotify.com/api/token', qs_1.default.stringify(data), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic YmU3OGVlMTk5YmRiNDc4MGE5ZjZhMDFjNTRlMTdiMTA6OGQ1MGVjOGEyMWE3NDVlZjg4NDI0MzIyZTk3ZjU5MGQ',
        },
    }).catch(async (err) => {
        console.log(chalk_1.default.red('[Spotify Library]: Ошибка получения обновленного токена. Возможно refreshToken истёк'), err.response.data);
        await configurationModel_1.default.findOneAndUpdate({ appId: 3 }, {
            $unset: {
                'settings.token': 1,
                'settings.refreshToken': 1,
                'settings.tokenExpiresIn': 1,
            },
        });
    });
    if (!response)
        return console.log(chalk_1.default.red('[Spotify Library]: Данные не получены! Операция была отменена'));
    const { access_token, refresh_token, expires_in } = response.data;
    const calculatedTime = new Date(new Date().getTime() + expires_in * 1000);
    await configurationModel_1.default.updateOne({ appId: 3 }, {
        $set: {
            'settings.token': access_token,
            'settings.refreshToken': refresh_token,
            'settings.tokenExpiresIn': Math.floor(calculatedTime),
        },
    });
};
exports.default = getToken;
