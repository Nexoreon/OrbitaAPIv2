"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.movePosts = exports.deleteAllPosts = exports.deletePosts = exports.deletePost = exports.updatePost = exports.createPost = exports.getPost = exports.getPosts = exports.getAllPosts = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const common_1 = require("../../utils/common");
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const postModel_1 = __importDefault(require("../../models/forum/postModel"));
const topicModel_1 = __importDefault(require("../../models/forum/topicModel"));
// possible errors
const sendError404 = (0, common_1.sendError)('Такого поста не найдено', 404);
const sendError404M = (0, common_1.sendError)('Не обнаружено постов с такими ID', 404);
const sendErrorWrongTopic = (0, common_1.sendError)('Эти посты уже находятся в этой теме', 400);
exports.getAllPosts = (0, catchAsync_1.default)(async (req, res) => {
    const posts = await postModel_1.default.find();
    const length = await postModel_1.default.countDocuments();
    res.status(200).json({
        status: 'ok',
        length,
        data: posts,
    });
});
exports.getPosts = (0, catchAsync_1.default)(async (req, res, next) => {
    const posts = await postModel_1.default.find({ _id: { $in: req.body.ids } });
    if (!posts)
        return next(sendError404M);
    res.status(200).json({
        status: 'ok',
        data: posts,
    });
});
exports.getPost = (0, catchAsync_1.default)(async (req, res, next) => {
    const post = await postModel_1.default.findById(req.params.id);
    if (!post)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        data: post,
    });
});
exports.createPost = (0, catchAsync_1.default)(async (req, res) => {
    const newPost = await postModel_1.default.create({
        ...req.body,
        authorId: req.user._id,
    });
    // update topic
    await topicModel_1.default.findByIdAndUpdate(req.body.relatedTo, {
        $addToSet: { posts: newPost._id },
        $inc: { postsCounter: 1 },
        updatedAt: Date.now(),
        ...(req.body.main && { mainPost: newPost._id }), // FIXME Уязвимость уровня API: Отсыл нового поста с main может сделать этот пост главным для темы
    });
    res.status(201).json({
        status: 'ok',
        data: newPost,
    });
});
exports.updatePost = (0, catchAsync_1.default)(async (req, res, next) => {
    req.body = {
        ...req.body,
        updatedAt: Date.now(),
    };
    const post = await postModel_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post)
        return next(sendError404);
    if (req.body.flags && req.body.flags.important || req.body.flags && !req.body.flags.important) {
        const importantStatus = req.body.flags.important;
        // update topic
        await topicModel_1.default.findByIdAndUpdate(post.relatedTo, {
            ...(importantStatus && { importantPost: post._id }),
            ...(!importantStatus && { $unset: { importantPost: 1 } }),
        });
    }
    res.status(200).json({
        status: 'ok',
        data: post,
    });
});
exports.deletePost = (0, catchAsync_1.default)(async (req, res, next) => {
    const post = await postModel_1.default.findByIdAndDelete(req.params.id);
    if (!post)
        return next(sendError404);
    // update topic
    await topicModel_1.default.findByIdAndUpdate(post.relatedTo, {
        $pull: { posts: post._id },
        $inc: { postsCounter: -1 },
    });
    res.status(204).json({
        status: 'ok',
        message: 'Пост успешно был удлаён!',
    });
});
exports.deletePosts = (0, catchAsync_1.default)(async (req, res) => {
    await postModel_1.default.deleteMany({ _id: { $in: req.body.ids } });
    const objectIDs = req.body.ids.map((id) => new mongoose_1.default.Types.ObjectId(id));
    // update topic
    await topicModel_1.default.findByIdAndUpdate(req.body.topicId, {
        $pull: { posts: { $in: objectIDs } },
        $inc: { postsCounter: -objectIDs.length },
    }, { new: true });
    res.status(204).json({
        status: 'ok',
        message: 'Успешно удалено',
    });
});
exports.deleteAllPosts = (0, catchAsync_1.default)(async (req, res) => {
    await postModel_1.default.deleteMany({ relatedTo: { $in: req.body.topicsIDs } });
    res.status(204).json({
        status: 'ok',
        message: 'Данные успешно удалены',
    });
});
exports.movePosts = (0, catchAsync_1.default)(async (req, res, next) => {
    const { posts, topicId, newTopicId } = req.body;
    if (topicId === newTopicId)
        return next(sendErrorWrongTopic);
    const postsObjectIDs = posts.map((id) => new mongoose_1.default.Types.ObjectId(id));
    const oldTopic = await topicModel_1.default.findByIdAndUpdate(topicId, {
        $pull: { posts: { $in: postsObjectIDs } },
        $inc: { postsCounter: -posts.length },
    });
    posts.map(async (post) => {
        await postModel_1.default.findByIdAndUpdate(post, {
            relatedTo: newTopicId,
        });
    });
    if (oldTopic.importantPost && posts.includes(oldTopic.importantPost.toString())) {
        await postModel_1.default.findByIdAndUpdate(oldTopic?.importantPost, {
            flags: { important: false },
        });
        oldTopic.importantPost = undefined;
        await oldTopic.save();
    }
    await topicModel_1.default.findByIdAndUpdate(newTopicId, {
        $addToSet: { posts: { $each: postsObjectIDs } },
        $inc: { postsCounter: posts.length },
    });
});
