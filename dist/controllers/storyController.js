"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStory = exports.updateStory = exports.getStory = exports.getStories = exports.createStory = void 0;
const storyModel_1 = __importDefault(require("../models/storyModel"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const common_1 = require("../utils/common");
// possible errors
const sendError404 = (0, common_1.sendError)('Такой истории не существует!', 404);
exports.createStory = (0, catchAsync_1.default)(async (req, res) => {
    const newStory = await storyModel_1.default.create(req.body);
    res.status(201).json({
        status: 'ok',
        data: newStory,
    });
});
exports.getStories = (0, catchAsync_1.default)(async (req, res) => {
    const stories = await storyModel_1.default.find();
    res.status(200).json({
        status: 'ok',
        data: stories,
    });
});
exports.getStory = (0, catchAsync_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const story = await storyModel_1.default.findById(id);
    if (!story)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        data: story,
    });
});
exports.updateStory = (0, catchAsync_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const story = await storyModel_1.default.findByIdAndUpdate(id, req.body, { new: true });
    if (!story)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        data: story,
    });
});
exports.deleteStory = (0, catchAsync_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const story = await storyModel_1.default.findByIdAndDelete(id);
    if (!story)
        return next(sendError404);
    res.status(204).json({
        status: 'ok',
        message: 'История успешно удалена',
    });
});
