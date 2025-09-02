"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthToken = exports.getToken = void 0;
/* eslint-disable camelcase */
/* eslint-disable no-console */
const axios_1 = __importDefault(require("axios"));
const qs_1 = __importDefault(require("qs"));
const chalk_1 = __importDefault(require("chalk"));
const AppError_1 = __importDefault(require("../../../utils/AppError"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const configurationModel_1 = __importDefault(require("../../../models/configurationModel"));
exports.getToken = (0, catchAsync_1.default)(async (req, res, next) => {
    const { tempToken } = req.query;
    const app = await configurationModel_1.default.findOne({ appId: 3 });
    if (!app)
        return next(new AppError_1.default('Ошибка получения параметров приложения!', 500));
    const tokenExpiresIn = +app.settings.tokenExpiresIn;
    const tokenExpired = tokenExpiresIn && tokenExpiresIn < new Date().getTime();
    if (tempToken || tokenExpired) {
        console.log(chalk_1.default.green('[Spotify Library]: Предоставлен tempToken или текущий токен истёк. Получение нового токена...'));
        req.query = {
            ...(tempToken && { tempToken }),
            refreshToken: app.settings.refreshToken,
        };
        return next();
    }
    if (!app.settings.token)
        return next(new AppError_1.default('Токен отсутствует!', 404));
    res.status(200).json({
        status: 'ok',
        data: app.settings.token,
    });
});
exports.getAuthToken = (0, catchAsync_1.default)(async (req, res, next) => {
    const { tempToken, refreshToken } = req.query;
    if (!tempToken && !refreshToken)
        return next(new AppError_1.default('Невозможно получить постоянный токен без предоставления временного!', 400));
    let data = {
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
    const response = await axios_1.default.post('https://accounts.spotify.com/api/token', qs_1.default.stringify(data), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded', // always send with this content type!
            Authorization: process.env.SPOTIFY_TOKEN,
        },
    })
        .catch(async (err) => {
        console.log(chalk_1.default.red(`[Spotify Library]: ${respErrorMsg}. Сброс токена...`), err);
        await configurationModel_1.default.findOneAndUpdate({ appId: 3 }, {
            $unset: {
                'settings.token': 1,
                'settings.refreshToken': 1,
                'settings.tokenExpiresIn': 1,
            },
        });
    });
    if (!response)
        return next(new AppError_1.default(respErrorMsg, 400));
    const { access_token, refresh_token, expires_in } = response.data;
    await configurationModel_1.default.updateOne({ appId: 3 }, {
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
