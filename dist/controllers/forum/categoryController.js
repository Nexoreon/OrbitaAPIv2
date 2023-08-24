"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategory = exports.getEverything = exports.getAllSubCategories = exports.getAllCategories = void 0;
const common_1 = require("../../utils/common");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const categoryModel_1 = __importDefault(require("../../models/forum/categoryModel"));
// possible errors
const sendError404 = (0, common_1.sendError)('Такой категории не найдено', 404);
exports.getAllCategories = (0, catchAsync_1.default)(async (req, res) => {
    const query = { parentId: { $exists: false } };
    const categories = await categoryModel_1.default.find(query);
    const length = await categoryModel_1.default.countDocuments(query);
    res.status(200).json({
        status: 'ok',
        length,
        data: categories,
    });
});
exports.getAllSubCategories = (0, catchAsync_1.default)(async (req, res) => {
    const query = { parentId: { $exists: true } };
    const subCategories = await categoryModel_1.default.find(query);
    const length = await categoryModel_1.default.countDocuments(query);
    res.status(200).json({
        status: 'ok',
        length,
        data: subCategories,
    });
});
exports.getEverything = (0, catchAsync_1.default)(async (req, res) => {
    const { withTopics } = req.query;
    let query = categoryModel_1.default.find();
    if (withTopics)
        query = categoryModel_1.default.find({ topics: { $ne: [] } });
    const categories = await query;
    // TODO: Change variable length logic to total
    // eslint-disable-next-line prefer-destructuring
    const length = categories.length;
    res.status(200).json({
        status: 'ok',
        length,
        data: categories,
    });
});
exports.getCategory = (0, catchAsync_1.default)(async (req, res, next) => {
    const category = await categoryModel_1.default.findById(req.params.id);
    if (!category)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        data: category,
    });
});
exports.createCategory = (0, catchAsync_1.default)(async (req, res) => {
    const { parentId } = req.query;
    if (parentId)
        req.body = { ...req.body, parentId };
    const newCategory = await categoryModel_1.default.create(req.body);
    if (parentId) {
        await categoryModel_1.default.findByIdAndUpdate(parentId, {
            $addToSet: { subCategories: newCategory._id },
        }, { new: true });
    }
    res.status(201).json({
        status: 'ok',
        data: newCategory,
    });
});
exports.updateCategory = (0, catchAsync_1.default)(async (req, res, next) => {
    const category = await categoryModel_1.default.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });
    if (!category)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        data: category,
    });
});
exports.deleteCategory = (0, catchAsync_1.default)(async (req, res, next) => {
    const category = await categoryModel_1.default.findByIdAndDelete(req.params.id);
    if (!category)
        return next(sendError404);
    if (category.subCategories.length) {
        await categoryModel_1.default.updateMany({ _id: category.subCategories }, {
            $unset: { parentId: '' },
        });
    }
    req.body.categoryId = category._id;
    next();
});
