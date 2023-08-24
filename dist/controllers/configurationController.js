"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeConfigurationParam = exports.changeConfiguration = exports.getConfiguration = exports.getConfigurations = exports.createConfiguration = void 0;
const common_1 = require("../utils/common");
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const configurationModel_1 = __importDefault(require("../models/configurationModel"));
// possible errors
const sendError404 = (0, common_1.sendError)('Такого приложения не существует!', 404);
const sendError400 = (0, common_1.sendError)('Необходимо указать ID приложения и/или его название', 400);
const sendErrorKeyValue = (0, common_1.sendError)('Необходимо указать ключ и значение для нового параметра', 400);
exports.createConfiguration = (0, catchAsync_1.default)(async (req, res, next) => {
    const { appId, appName } = req.body;
    if (!appId || !appName)
        return next(sendError400);
    await configurationModel_1.default.create({ appId, appName });
    res.status(201).json({
        status: 'ok',
        message: 'Документ с настройками для приложения успешно создан!',
    });
});
exports.getConfigurations = (0, catchAsync_1.default)(async (req, res) => {
    const configurations = await configurationModel_1.default.find();
    res.status(200).json({
        status: 'ok',
        data: configurations,
    });
});
exports.getConfiguration = (0, catchAsync_1.default)(async (req, res, next) => {
    const { appId, appName } = req.query;
    if (!appId && !appName)
        return next(sendError400);
    const configuration = await configurationModel_1.default.findOne({ $or: [{ appId: +appId }, { appName }] });
    if (!configuration)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        data: configuration,
    });
});
exports.changeConfiguration = (0, catchAsync_1.default)(async (req, res, next) => {
    const { appId, appName } = req.query;
    if (!appId && !appName)
        return next(sendError400);
    const newConfiguration = await configurationModel_1.default.findOneAndUpdate({ $or: [{ appId }, { appName }] }, { ...req.body }, { new: true });
    if (!newConfiguration)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        message: 'Изменения успешно применены!',
        data: newConfiguration,
    });
});
exports.changeConfigurationParam = (0, catchAsync_1.default)(async (req, res, next) => {
    const { appId, key, value, type } = req.body;
    if (!appId)
        return next(sendError400);
    if (!key || value === undefined)
        return next(sendErrorKeyValue);
    const convertValue = () => {
        if (type === 'number')
            return +value;
        if (type === 'boolean')
            return Boolean(value);
        if (type === 'date')
            return new Date(+value);
        return value;
    };
    // update / create param
    await configurationModel_1.default.findOneAndUpdate({ appId }, {
        $set: { [`settings.${key}`]: convertValue() },
    });
    res.status(200).json({
        status: 'ok',
        message: 'Параметр успешно обновлён',
    });
});
