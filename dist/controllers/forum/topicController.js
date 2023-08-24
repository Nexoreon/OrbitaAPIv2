"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllTopics = exports.deleteTopics = exports.deleteTopic = exports.moveTopics = exports.moveTopic = exports.updateTopics = exports.updateTopic = exports.createTopic = exports.getTopic = exports.getTopics = exports.getAllTopics = void 0;
const mongoose_1 = require("mongoose");
const common_1 = require("../../utils/common");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const topicModel_1 = __importDefault(require("../../models/forum/topicModel"));
const postModel_1 = __importDefault(require("../../models/forum/postModel"));
const categoryModel_1 = __importDefault(require("../../models/forum/categoryModel"));
// possible errors
const sendError404 = (0, common_1.sendError)('Такая тема не найдена', 404);
const sendError404M = (0, common_1.sendError)('Такие темы не найдены', 404);
const sendErrorParentParam = (0, common_1.sendError)('Необходимо указать для какой категории или подкатегории создаётся эта тема', 400);
const sendErrorIdsEmpty = (0, common_1.sendError)('Необходимо указать ID тем для их обновления', 400);
const sendErrorNoMoveParams = (0, common_1.sendError)('Передано недостаточно аргументов. Убедитесь что вы указали ID тем, категорию родителя и категорию в которую переносятся посты', 400);
const sendErrorNoDeleteParams = (0, common_1.sendError)('Для удаления нескольких тем необходимо указать ID удаляемых тем и ID категории родителя', 400);
exports.getAllTopics = (0, catchAsync_1.default)(async (req, res) => {
    const topics = await topicModel_1.default.find();
    const length = await topicModel_1.default.countDocuments();
    res.status(200).json({
        status: 'success',
        length,
        data: topics,
    });
});
exports.getTopics = (0, catchAsync_1.default)(async (req, res, next) => {
    const { categoryId } = req.query;
    const topics = await topicModel_1.default.find({ parentId: categoryId });
    if (!topics)
        return next(sendError404M);
    res.status(200).json({
        status: 'success',
        data: topics,
    });
});
exports.getTopic = (0, catchAsync_1.default)(async (req, res, next) => {
    const topic = await topicModel_1.default.findById(req.params.id);
    if (!topic)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        data: topic,
    });
});
exports.createTopic = (0, catchAsync_1.default)(async (req, res, next) => {
    const { parentId } = req.query;
    if (!parentId)
        return next(sendErrorParentParam);
    const newTopic = await topicModel_1.default.create({
        ...req.body,
        authorId: req.user._id,
        parentId,
    });
    // add id to parent
    await categoryModel_1.default.findByIdAndUpdate(parentId, {
        $addToSet: { topics: newTopic._id },
    });
    req.body = {
        ...req.body,
        relatedTo: newTopic._id,
        main: true,
        flags: {},
    };
    next();
});
exports.updateTopic = (0, catchAsync_1.default)(async (req, res, next) => {
    const topic = await topicModel_1.default.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });
    if (!topic)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        data: topic,
    });
});
exports.updateTopics = (0, catchAsync_1.default)(async (req, res, next) => {
    const { topicsIDs } = req.body;
    if (!topicsIDs.length)
        return next(sendErrorIdsEmpty);
    const convertedIDs = topicsIDs.map((id) => new mongoose_1.Types.ObjectId(id));
    if (req.body.flags) {
        await topicModel_1.default.updateMany({ _id: { $in: convertedIDs } }, {
            ...(req.body.flags.important && { 'flags.important': req.body.flags.important }),
            ...(req.body.flags.locked && { 'flags.locked': req.body.flags.locked }),
            ...(req.body.flags.pinned && { 'flags.pinned': req.body.flags.pinned }),
            ...(req.body.flags.important === false && { 'flags.important': req.body.flags.important }),
            ...(req.body.flags.locked === false && { 'flags.locked': req.body.flags.locked }),
            ...(req.body.flags.pinned === false && { 'flags.pinned': req.body.flags.pinned }),
        });
    }
    res.status(200).json({
        status: 'ok',
        message: 'Темы успешно обновлены',
    });
});
exports.moveTopic = (0, catchAsync_1.default)(async (req, res, next) => {
    const { topicId, moveTo } = req.body;
    const topic = await topicModel_1.default.findByIdAndUpdate(topicId, {
        parentId: moveTo,
    });
    if (!topic)
        return next(sendError404);
    // remove from old category
    await categoryModel_1.default.findByIdAndUpdate(topic.parentId, {
        $pull: { topics: new mongoose_1.Types.ObjectId(topicId) },
    });
    // add to new category
    await categoryModel_1.default.findByIdAndUpdate(moveTo, {
        $addToSet: { topics: new mongoose_1.Types.ObjectId(topicId) },
    });
    res.status(200).json({
        status: 'ok',
        message: 'Успешно перенесено',
    });
});
exports.moveTopics = (0, catchAsync_1.default)(async (req, res, next) => {
    const { topicsIDs, categoryId, moveTo } = req.body;
    const convertedIDs = topicsIDs.map((id) => new mongoose_1.Types.ObjectId(id));
    if (!moveTo || !topicsIDs)
        return next(sendErrorNoMoveParams);
    // remove from old category
    await categoryModel_1.default.findByIdAndUpdate(categoryId, {
        $pull: { topics: { $in: convertedIDs } },
    });
    // add to new category
    const newCategory = await categoryModel_1.default.findByIdAndUpdate(moveTo, {
        $addToSet: { topics: { $each: convertedIDs } },
    }, { new: true });
    convertedIDs.map(async (topic) => {
        await topicModel_1.default.findByIdAndUpdate(topic, {
            parentId: moveTo,
        });
    });
    res.status(200).json({
        status: 'ok',
        data: newCategory,
    });
});
exports.deleteTopic = (0, catchAsync_1.default)(async (req, res, next) => {
    const topic = await topicModel_1.default.findByIdAndDelete(req.params.id);
    if (!topic)
        return next(sendError404);
    // update category
    await categoryModel_1.default.findByIdAndUpdate(topic.parentId, {
        $pull: { topics: new mongoose_1.Types.ObjectId(req.params.id) },
    });
    // delete posts
    await postModel_1.default.deleteMany({ _id: { $in: topic.posts } });
    res.status(204).json({
        status: 'ok',
        message: 'Тема успешно удалена',
    });
});
exports.deleteTopics = (0, catchAsync_1.default)(async (req, res, next) => {
    const { topicsIDs, categoryId } = req.body;
    const convertedIDs = topicsIDs.map((id) => new mongoose_1.Types.ObjectId(id));
    if (!topicsIDs || categoryId)
        return next(sendErrorNoDeleteParams);
    await topicModel_1.default.deleteMany({ _id: { $in: convertedIDs } });
    await postModel_1.default.deleteMany({ relatedTo: { $in: convertedIDs } });
    await categoryModel_1.default.findByIdAndUpdate(categoryId, {
        $pull: { topics: { $in: convertedIDs } },
    });
    res.status(204).json({
        status: 'ok',
        message: 'Темы успешно удалены',
    });
});
exports.deleteAllTopics = (0, catchAsync_1.default)(async (req, res, next) => {
    const topicsIDs = await topicModel_1.default.find({ parentId: req.body.categoryId });
    req.body.topicsIDs = topicsIDs.map((topic) => topic._id);
    // delete topics
    await topicModel_1.default.deleteMany({ parentId: req.body.categoryId });
    next();
});
