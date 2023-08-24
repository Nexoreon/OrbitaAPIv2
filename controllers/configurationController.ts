import { sendError } from '../utils/common';
import catchAsync from '../utils/catchAsync';
import Configuration from '../models/configurationModel';

// possible errors
const sendError404 = sendError('Такого приложения не существует!', 404);
const sendError400 = sendError('Необходимо указать ID приложения и/или его название', 400);
const sendErrorKeyValue = sendError('Необходимо указать ключ и значение для нового параметра', 400);

export const createConfiguration = catchAsync(async (req, res, next) => {
    const { appId, appName } = req.body;
    if (!appId || !appName) return next(sendError400);
    await Configuration.create({ appId, appName });

    res.status(201).json({
        status: 'ok',
        message: 'Документ с настройками для приложения успешно создан!',
    });
});

export const getConfigurations = catchAsync(async (req, res) => {
    const configurations = await Configuration.find();

    res.status(200).json({
        status: 'ok',
        data: configurations,
    });
});

export const getConfiguration = catchAsync(async (req, res, next) => {
    const { appId, appName } = req.query;
    if (!appId && !appName) return next(sendError400);

    const configuration = await Configuration.findOne({ $or: [{ appId: +appId! }, { appName }] });
    if (!configuration) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        data: configuration,
    });
});

export const changeConfiguration = catchAsync(async (req, res, next) => {
    const { appId, appName } = req.query;
    if (!appId && !appName) return next(sendError400);

    const newConfiguration = await Configuration.findOneAndUpdate({ $or: [{ appId }, { appName }] }, { ...req.body }, { new: true });
    if (!newConfiguration) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        message: 'Изменения успешно применены!',
        data: newConfiguration,
    });
});

export const changeConfigurationParam = catchAsync(async (req, res, next) => {
    const { appId, key, value, type } = req.body;

    if (!appId) return next(sendError400);
    if (!key || value === undefined) return next(sendErrorKeyValue);

    const convertValue = () => {
        if (type === 'number') return +value;
        if (type === 'boolean') return Boolean(value);
        if (type === 'date') return new Date(+value);
        return value;
    };

    // update / create param
    await Configuration.findOneAndUpdate({ appId }, {
        $set: { [`settings.${key}`]: convertValue() },
    });

    res.status(200).json({
        status: 'ok',
        message: 'Параметр успешно обновлён',
    });
});
