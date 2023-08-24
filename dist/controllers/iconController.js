"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIcons = exports.createIcon = void 0;
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const iconModel_1 = __importDefault(require("../models/iconModel"));
exports.createIcon = (0, catchAsync_1.default)(async (req, res) => {
    const newIcon = await iconModel_1.default.create(req.body);
    res.status(201).json({
        status: 'ok',
        data: newIcon,
    });
});
exports.getIcons = (0, catchAsync_1.default)(async (req, res) => {
    const { query } = req.query;
    const icons = await iconModel_1.default.find(query ? { name: { $regex: query, $options: 'i' } } : {}).limit(!query ? 50 : 0);
    const total = icons.length;
    res.status(200).json({
        status: 'ok',
        data: { items: icons, total },
    });
});
