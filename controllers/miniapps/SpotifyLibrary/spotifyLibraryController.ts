/* eslint-disable camelcase */
/* eslint-disable no-console */
import axios from 'axios';
import qs from 'qs';
import chalk from 'chalk';
import AppError from '../../../utils/AppError';
import catchAsync from '../../../utils/catchAsync';
import Application from '../../../models/configurationModel';

export const getToken = catchAsync(async (req, res, next) => {
    const { tempToken } = req.query;
    const app = await Application.findOne({ appId: 3 });
    if (!app) return next(new AppError('Ошибка получения параметров приложения!', 500));
    const tokenExpiresIn = +app.settings.tokenExpiresIn;
    const tokenExpired = tokenExpiresIn && tokenExpiresIn < new Date().getTime();

    if (tempToken || tokenExpired) {
        console.log(chalk.green('[Spotify Library]: Предоставлен tempToken или текущий токен истёк. Получение нового токена...'));
        req.query = {
            ...(tempToken && { tempToken }),
            refreshToken: app.settings.refreshToken,
        };
        return next();
    }

    if (!app.settings.token) return next(new AppError('Токен отсутствует!', 404));
    res.status(200).json({
        status: 'ok',
        data: app.settings.token,
    });
});

export const getAuthToken = catchAsync(async (req, res, next) => {
    const { tempToken, refreshToken } = req.query;
    if (!tempToken && !refreshToken) return next(new AppError('Невозможно получить постоянный токен без предоставления временного!', 400));

    let data: object = {
        grant_type: 'authorization_code',
        code: tempToken,
        redirect_uri: 'https://192.168.0.100/database/mini-apps/spotify-library/settings',
    };

    if (refreshToken !== undefined) {
        data = {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        };
    }

    const respErrorMsg = 'Ошибка получения постоянного токена! Возможно истёк refreshToken';
    const response = await axios.post('https://accounts.spotify.com/api/token', qs.stringify(data), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded', // always send with this content type!
            Authorization: process.env.SPOTIFY_TOKEN,
        },
    })
    .catch(async (err) => {
        console.log(chalk.red(`[Spotify Library]: ${respErrorMsg}. Сброс токена...`), err);
        await Application.findOneAndUpdate({ appId: 3 }, {
            $unset: {
                'settings.token': 1,
                'settings.refreshToken': 1,
                'settings.tokenExpiresIn': 1,
            },
        });
    });

    if (!response) return next(new AppError(respErrorMsg, 400));
    const { access_token, refresh_token, expires_in } = response.data;

    await Application.updateOne({ appId: 3 }, {
        $set: {
            'settings.token': access_token,
            'settings.refreshToken': refresh_token,
            'settings.tokenExpiresIn': Math.floor(new Date().getTime() + expires_in * 1000),
        },
    });

    res.status(200).json({
        status: 'ok',
        data: access_token,
    });
});
