"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopicData = exports.getCategoryData = exports.getForumData = void 0;
/* eslint-disable prefer-destructuring */
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const categoryModel_1 = __importDefault(require("../../models/forum/categoryModel"));
const topicModel_1 = __importDefault(require("../../models/forum/topicModel"));
const postModel_1 = __importDefault(require("../../models/forum/postModel"));
exports.getForumData = (0, catchAsync_1.default)(async (req, res) => {
    const categories = await categoryModel_1.default.aggregate([
        {
            $match: { parentId: { $exists: false } },
        },
        {
            $lookup: {
                from: 'forum_categories',
                let: { id: '$_id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$parentId', '$$id'] }, 'flags.isLink': false } },
                    { $project: { name: 1, url: 1 } },
                ],
                as: 'subCategories',
            },
        },
        {
            $lookup: {
                from: 'forum_topics',
                let: { id: '$_id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$parentId', '$$id'] } } },
                    { $sort: { updatedAt: -1 } },
                    { $limit: 1 },
                    { $project: { name: 1, url: 1 } },
                ],
                as: 'temp.updatedTopic',
            },
        },
        {
            $set: {
                'updatedTopic.topic': { $mergeObjects: '$temp.updatedTopic' },
            },
        },
        {
            $lookup: {
                from: 'forum_posts',
                let: { id: '$updatedTopic.topic._id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$relatedTo', '$$id'] } } },
                    { $sort: { createdAt: -1 } },
                    { $limit: 1 },
                    { $project: { createdAt: 1, authorId: 1 } },
                ],
                as: 'temp.post',
            },
        },
        {
            $set: {
                'updatedTopic.post': { $mergeObjects: '$temp.post' },
            },
        },
        {
            $lookup: {
                from: 'users',
                let: { id: '$updatedTopic.post.authorId' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$id'] } } },
                    { $project: { name: 1, photo: 1 } },
                ],
                as: 'temp.author',
            },
        },
        {
            $set: {
                'updatedTopic.author': { $mergeObjects: '$temp.author' },
            },
        },
        {
            $unset: ['temp'],
        },
    ]);
    res.status(200).json({
        status: 'ok',
        data: { categories },
    });
});
exports.getCategoryData = (0, catchAsync_1.default)(async (req, res) => {
    const { limit, page } = req.query;
    const category = await categoryModel_1.default.findOne({ url: req.params.categoryUrl });
    if (!category) {
        return res.status(404).json({
            status: 'fail',
            message: 'Эта категория не существует',
            data: { categoryNotExists: true },
        });
    }
    const categoryTopics = await topicModel_1.default.find({ parentId: category._id });
    const categoryTopicsPinned = await topicModel_1.default.find({ parentId: category.id, 'flags.pinned': true });
    const topicsLength = categoryTopics.length;
    const lengthWithoutPinned = categoryTopics.length - categoryTopicsPinned.length;
    const subCategories = await categoryModel_1.default.aggregate([
        {
            $match: { parentId: category._id },
        },
        {
            $lookup: {
                from: 'forum_categories',
                let: { id: '$_id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$parentId', '$$id'] } } },
                    { $project: { name: 1, url: 1 } },
                ],
                as: 'subCategories',
            },
        },
        {
            $lookup: {
                from: 'forum_topics',
                let: { id: '$_id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$parentId', '$$id'] } } },
                    { $sort: { updatedAt: -1 } },
                    { $limit: 1 },
                    { $project: { name: 1, url: 1 } },
                ],
                as: 'temp.updatedTopic',
            },
        },
        {
            $set: {
                'updatedTopic.topic': { $mergeObjects: '$temp.updatedTopic' },
            },
        },
        {
            $lookup: {
                from: 'forum_posts',
                let: { id: '$updatedTopic.topic._id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$relatedTo', '$$id'] } } },
                    { $sort: { createdAt: -1 } },
                    { $limit: 1 },
                    { $project: { createdAt: 1, authorId: 1 } },
                ],
                as: 'temp.post',
            },
        },
        {
            $set: {
                'updatedTopic.post': { $mergeObjects: '$temp.post' },
            },
        },
        {
            $lookup: {
                from: 'users',
                let: { id: '$updatedTopic.post.authorId' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$id'] } } },
                    { $project: { name: 1, photo: 1 } },
                ],
                as: 'temp.author',
            },
        },
        {
            $set: {
                'updatedTopic.author': { $mergeObjects: '$temp.author' },
            },
        },
        {
            $unset: ['temp'],
        },
    ]);
    const sort = req.query.sort;
    const topics = await topicModel_1.default.aggregate([
        {
            $match: { parentId: category._id, 'flags.pinned': false },
        },
        {
            $sort: sort ? { [sort.split('-')[1]]: -1 } : { createdAt: -1 },
        },
        {
            $skip: page ? (+page * 1 - 1) * 15 : 0,
        },
        {
            $limit: limit && +limit || 15,
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
    let pinnedTopics;
    if (page && +page !== 1) {
        const totalPages = !Number.isInteger(lengthWithoutPinned / +limit) ? Math.floor(lengthWithoutPinned / +limit) + 1 : lengthWithoutPinned / +limit;
        const isPageExists = totalPages < +page;
        if (isPageExists || +page === 0 || Number.isNaN(+page)) {
            return res.status(404).json({
                status: 'fail',
                data: { isPageExists: false, pageToRedirect: totalPages === 0 ? 1 : totalPages },
            });
        }
    }
    else {
        pinnedTopics = await topicModel_1.default.aggregate([
            {
                $match: { parentId: category._id, 'flags.pinned': true },
            },
            {
                $sort: sort ? { [sort.split('-')[1]]: -1 } : { createdAt: -1 },
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
    }
    res.status(200).json({
        status: 'ok',
        data: {
            category,
            subCategories,
            topics,
            pinnedTopics,
            topicsLength,
            lengthWithoutPinned,
        },
    });
});
exports.getTopicData = (0, catchAsync_1.default)(async (req, res) => {
    const { limit, page, offset } = req.query;
    let topic = await topicModel_1.default.aggregate([
        {
            $match: { url: req.params.topicUrl },
        },
        {
            $lookup: {
                from: 'users',
                let: { id: '$authorId' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$id'] } } },
                    { $project: { name: 1, photo: 1 } },
                ],
                as: 'author',
            },
        },
        {
            $set: { author: { $mergeObjects: '$author' } },
        },
    ]);
    if (!topic.length) {
        return res.status(404).json({
            status: 'fail',
            message: 'Такой темы не существует',
            data: { topicNotExists: true },
        });
    }
    topic = topic[0];
    // inc views counter
    await topicModel_1.default.findOneAndUpdate({ url: req.params.topicUrl }, {
        $inc: { views: 1 },
    });
    let mainPost = await postModel_1.default.aggregate([
        {
            $match: { _id: topic.mainPost },
        },
        {
            $lookup: {
                from: 'users',
                let: { id: '$authorId' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$id'] } } },
                    { $project: { name: 1, photo: 1, role: 1 } },
                ],
                as: 'author',
            },
        },
        {
            $set: { author: { $mergeObjects: '$author' } },
        },
    ]);
    mainPost = mainPost[0];
    const postsLength = topic.posts.length - +offset;
    const posts = await postModel_1.default.aggregate([
        {
            $match: { relatedTo: topic._id },
        },
        {
            $sort: { createdAt: 1 },
        },
        {
            $skip: page ? (+page - 1) * 7 + 1 : 1,
        },
        {
            $limit: +limit || 7,
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
    ]);
    if (page && +page !== 1) {
        const totalPages = !Number.isInteger(postsLength / +limit) ? Math.floor(postsLength / +limit) + 1 : postsLength / +limit;
        const isPageExists = totalPages < +page;
        if (isPageExists || +page === 0 || Number.isNaN(+page)) {
            return res.status(404).json({
                status: 'fail',
                message: 'Такая страница не существует. Возврат к последней странице',
                data: { isPageExists: false, pageToRedirect: totalPages === 0 ? 1 : totalPages },
            });
        }
    }
    let importantPost;
    if (topic.importantPost) {
        importantPost = await postModel_1.default.aggregate([
            {
                $match: { _id: topic.importantPost },
            },
            {
                $lookup: {
                    from: 'users',
                    let: { id: '$authorId' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$id'] } } },
                        { $project: { name: 1, photo: 1 } },
                    ],
                    as: 'author',
                },
            },
            {
                $set: { author: { $mergeObjects: '$author' } },
            },
        ]);
        importantPost = importantPost[0];
        if (importantPost === null) {
            await topicModel_1.default.findOneAndUpdate({ url: req.params.topicUrl }, {
                importantPost: undefined,
            });
        }
    }
    res.status(200).json({
        status: 'ok',
        data: {
            topic,
            mainPost,
            posts,
            postsLength,
            importantPost,
        },
    });
});
