"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnImage = exports.uploadImage = exports.moderationDeleteMany = exports.getModerationData = exports.searchData = exports.getAppData = void 0;
const multer_1 = __importDefault(require("multer"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
const postModel_1 = __importDefault(require("../models/forum/postModel"));
const topicModel_1 = __importDefault(require("../models/forum/topicModel"));
const categoryModel_1 = __importDefault(require("../models/forum/categoryModel"));
const guideModel_1 = __importDefault(require("../models/guides/guideModel"));
const storyModel_1 = __importDefault(require("../models/storyModel"));
const achievementModel_1 = __importDefault(require("../models/achievements/achievementModel"));
exports.getAppData = (0, catchAsync_1.default)(async (req, res) => {
    const { _id } = req.user;
    const devBuild = req.get('origin').includes('localhost');
    const hasUnreadNotifications = await notificationModel_1.default.find({
        receivers: { $in: _id },
        sendOut: { $lte: Date.now() },
        readBy: { $ne: _id },
    });
    res.status(200).json({
        status: 'ok',
        data: {
            user: req.user,
            hasUnreadNotifications: hasUnreadNotifications.length,
            ...(devBuild && { devBuild: true }),
        },
    });
});
exports.searchData = (0, catchAsync_1.default)(async (req, res) => {
    const { query } = req.query;
    // Get topics
    const inTopics = await topicModel_1.default.aggregate([
        {
            $match: { $or: [{ name: { $regex: query, $options: 'i' } }, { tags: { $all: [query] } }] },
        },
        {
            $lookup: {
                from: 'users',
                let: { id: '$authorId' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$id'] } } },
                    { $project: { name: 1 } },
                ],
                as: 'author',
            },
        },
        {
            $set: { author: { $mergeObjects: '$author' } },
        },
        {
            $lookup: {
                from: 'forum_posts',
                let: { id: '$_id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$relatedTo', '$$id'] } } },
                    { $sort: { createdAt: -1 } },
                    { $limit: 1 },
                    { $project: { authorId: 1, createdAt: 1, url: 1 } },
                ],
                as: 'temp.latestPost',
            },
        },
        {
            $set: { 'latestPost.post': { $mergeObjects: { $last: '$temp.latestPost' } } },
        },
        {
            $lookup: {
                from: 'users',
                let: { id: '$latestPost.post.authorId' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$id'] } } },
                    { $project: { name: 1, photo: 1 } },
                ],
                as: 'temp.author',
            },
        },
        {
            $set: { 'latestPost.author': { $mergeObjects: '$temp.author' } },
        },
        {
            $unset: ['temp'],
        },
    ]);
    const inPosts = await postModel_1.default.aggregate([
        {
            $match: { data: { $regex: query, $options: 'i' } },
        },
        {
            $lookup: {
                from: 'users',
                let: { id: '$authorId' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$id'] } } },
                    { $project: { name: 1, email: 1, photo: 1, role: 1 } },
                ],
                as: 'author',
            },
        },
        {
            $set: { author: { $mergeObjects: '$author' } },
        },
        {
            $lookup: {
                from: 'forum_topics',
                let: { id: '$relatedTo' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$id'] } } },
                    { $project: { name: 1, url: 1, posts: 1 } },
                ],
                as: 'parent',
            },
        },
        {
            $set: { parent: { $mergeObjects: '$parent' } },
        },
    ]);
    const regexSearch = { $regex: query, $options: 'i' };
    const inGuides = await guideModel_1.default.aggregate([
        {
            $lookup: {
                from: 'guides_sections',
                let: { guideId: '$_id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$guideId', '$$guideId'] }, ...(query && { title: regexSearch }) } },
                ],
                as: 'sections',
            },
        },
        {
            $lookup: {
                from: 'guides_parts',
                let: { guideId: '$_id' },
                pipeline: [
                    { $match: {
                            $or: [
                                { $expr: { $eq: ['$guideId', '$$guideId'] }, ...(query && { title: regexSearch }) },
                                { $expr: { $eq: ['$guideId', '$$guideId'] }, ...(query && { content: regexSearch }) },
                            ]
                        },
                    },
                ],
                as: 'parts',
            },
        },
        {
            $match: query ? { $or: [{ title: regexSearch }, { $or: [{ sections: { $ne: [] } }, { parts: { $ne: [] } }] }] } : {},
        },
        {
            $project: { category: 1, title: 1 },
        },
    ]);
    res.status(200).json({
        status: 'ok',
        data: { inTopics, inPosts, inGuides },
    });
});
exports.getModerationData = (0, catchAsync_1.default)(async (req, res) => {
    let category = storyModel_1.default;
    const { type, limit, search } = req.query;
    if (type === 'notifications')
        category = notificationModel_1.default;
    if (type === 'topics')
        category = topicModel_1.default;
    if (type === 'categories')
        category = categoryModel_1.default;
    if (type === 'achievements')
        category = achievementModel_1.default;
    // if (type === 'inventory') category = InventoryItem;
    // if (type === 'store') category = StoreProduct;
    const regSearch = new RegExp(search, 'i');
    const total = await category.countDocuments({ $or: [{ name: regSearch }, { title: regSearch }] });
    const data = await category.find({ $or: [{ name: regSearch }, { title: regSearch }] }).sort({ createdAt: -1 }).limit(+limit);
    res.status(200).json({
        data: { items: data, total },
    });
});
exports.moderationDeleteMany = (0, catchAsync_1.default)(async (req, res) => {
    const { type } = req.query;
    const { ids } = req.body;
    let query = storyModel_1.default.deleteMany({ _id: { $in: ids } });
    if (type === 'notifications')
        query = notificationModel_1.default.deleteMany({ _id: { $in: ids } });
    if (type === 'topics')
        query = topicModel_1.default.deleteMany({ _id: { $in: ids } });
    if (type === 'categories')
        query = categoryModel_1.default.deleteMany({ _id: { $in: ids } });
    await query;
    res.status(204).json({
        status: 'ok',
    });
});
// multer configuration
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const { path } = req.query;
        cb(null, `../../site/public/img/${path || ''}`);
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.split('/')[1];
        cb(null, `img-${req.user.id}-${Date.now()}.${ext}`);
    },
});
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    }
    else {
        return cb(new AppError_1.default('Файл не является изображением!', 400), false);
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter: multerFilter,
});
// Upload image
exports.uploadImage = upload.single('file');
exports.returnImage = (0, catchAsync_1.default)(async (req, res) => {
    const { path } = req.query;
    res.status(200).json({
        status: 'success',
        data: {
            filename: req.file.filename,
            location: `https://192.168.0.100/site/public/img/${path ? `${path}/` : ''}${req.file.filename}`,
        },
    });
});
