/* eslint-disable no-console */
/* eslint-disable camelcase */
import chalk from 'chalk';
import qs from 'qs';
import axios from 'axios';
import Configuration from '../../models/configurationModel';

const getToken = async () => {
    console.log(chalk.green('[Spotify Library]: Запуск проверки актуальности токена...'));
    const config = await Configuration.findOne({ appId: 3 });
    if (!config) return console.log(chalk.red('[Spotify Library]: Ошибка обнаружения параметров приложения!'));
    const tokenExpiresIn = +config.settings.tokenExpiresIn;
    const tokenExpired = tokenExpiresIn && tokenExpiresIn < new Date().getTime();

    if (tokenExpired) {
        console.log(chalk.green('[Spotify Library]: Текущий токен истёк. Получение нового токена...'));
        return getAuthToken(config.settings.refreshToken);
    }
    console.log(chalk.green('[Spotify Library]: Токен актуален, обновление не требуется'));
};

const getAuthToken = async (refreshToken: string) => {
    const data = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
    };

    // Ключ авторизации. клиент id + секрет id конвертированный в base64 код
    const response = await axios.post('https://accounts.spotify.com/api/token', qs.stringify(data), { // Посылаем тело используя пакет qs и устанавливаем хэдеры
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded', // Обязательно должно быть закодировано в этот тип данных
            Authorization: 'Basic YmU3OGVlMTk5YmRiNDc4MGE5ZjZhMDFjNTRlMTdiMTA6OGQ1MGVjOGEyMWE3NDVlZjg4NDI0MzIyZTk3ZjU5MGQ',
        },
    }).catch(async (err) => {
        console.log(chalk.red('[Spotify Library]: Ошибка получения обновленного токена. Возможно refreshToken истёк'), err.response.data);
        await Configuration.findOneAndUpdate({ appId: 3 }, {
            $unset: {
                'settings.token': 1,
                'settings.refreshToken': 1,
                'settings.tokenExpiresIn': 1,
            },
        });
    });

    if (!response) return console.log(chalk.red('[Spotify Library]: Данные не получены! Операция была отменена'));
    const { access_token, refresh_token, expires_in } = response.data;
    const calculatedTime = new Date(new Date().getTime() + expires_in * 1000) as unknown as number;
    await Configuration.updateOne({ appId: 3 }, {
        $set: {
            'settings.token': access_token,
            'settings.refreshToken': refresh_token,
            'settings.tokenExpiresIn': Math.floor(calculatedTime),
        },
    });
};

export default getToken;
