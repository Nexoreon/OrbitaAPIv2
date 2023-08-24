"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePackage = exports.updatePackage = exports.createPackage = exports.getPackage = exports.getPackages = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const common_1 = require("../../utils/common");
const packageModel_1 = __importDefault(require("../../models/miniapps/packageModel"));
// possible errors
const sendError404 = (0, common_1.sendError)('Такого пакета не найдено!', 404);
// eslint-disable-next-line no-unused-vars
const categories = [
    'Фреймворки',
    'TypeScript',
    'Редакторы текста/кода',
    'Webpack и его плагины',
    'React и его плагины',
    'Babel и его плагины',
    'Сервер и API',
    'Валидаторы',
    'Другое',
];
exports.getPackages = (0, catchAsync_1.default)(async (req, res) => {
    const packages = await packageModel_1.default.aggregate([
        { $group: { _id: '$category', total: { $sum: 1 }, items: { $push: '$$ROOT' } } },
        { $project: { category: '$_id', total: 1, items: 1, _id: 0 } },
    ]);
    const total = await packageModel_1.default.countDocuments();
    res.status(200).json({
        status: 'ok',
        data: { total, packages },
    });
});
exports.getPackage = (0, catchAsync_1.default)(async (req, res, next) => {
    const pkg = await packageModel_1.default.findById(req.params.id);
    if (!pkg)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        data: pkg,
    });
});
exports.createPackage = (0, catchAsync_1.default)(async (req, res) => {
    const pkg = await packageModel_1.default.create(req.body);
    res.status(201).json({
        status: 'ok',
        data: pkg,
    });
});
exports.updatePackage = (0, catchAsync_1.default)(async (req, res, next) => {
    const pkg = await packageModel_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pkg)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        data: pkg,
    });
});
exports.deletePackage = (0, catchAsync_1.default)(async (req, res, next) => {
    const pkg = await packageModel_1.default.findByIdAndDelete(req.params.id);
    if (!pkg)
        return next(sendError404);
    res.status(204).json({
        status: 'ok',
        message: 'Пакет успешно удалён',
    });
});
