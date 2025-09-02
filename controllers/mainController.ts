import multer from 'multer';
import { Request } from 'express';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';

import Notification from '../models/notificationModel';
import Post from '../models/forum/postModel';
import Topic from '../models/forum/topicModel';
import Category from '../models/forum/categoryModel';
import Guide from '../models/guides/guideModel';
import Story from '../models/storyModel';
import Achievement from '../models/achievements/achievementModel';

export const getAppData = catchAsync(async (req, res) => {
    const { _id } = req.user!;
    const devBuild = req.get('origin')!.includes('localhost');

    const hasUnreadNotifications = await Notification.find({
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

export const searchData = catchAsync(async (req, res) => {
    const { query, offsets } = req.query;
    const decodedOffsets = (offsets as string).split(',').map((n: string) => +n);
    console.log(decodedOffsets);

    // Get topics
    const inTopics = await Topic.aggregate([
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

    const inPosts = await Post.aggregate([
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
            $limit: decodedOffsets[1],
        },
        {
            $set: { parent: { $mergeObjects: '$parent' } },
        },
    ]);

    const regexSearch = { $regex: query, $options: 'i' };
    const inGuides = await Guide.aggregate([
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
                        ] },
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

export const getModerationData = catchAsync(async (req, res) => {
    let category: any = Story;

    const { type, limit, search } = req.query;
    if (type === 'notifications') category = Notification;
    if (type === 'topics') category = Topic;
    if (type === 'categories') category = Category;
    if (type === 'achievements') category = Achievement;
    // if (type === 'inventory') category = InventoryItem;
    // if (type === 'store') category = StoreProduct;

    const regSearch = new RegExp(search as string, 'i');
    const total = await category.countDocuments({ $or: [{ name: regSearch }, { title: regSearch }] });
    const data = await category.find({ $or: [{ name: regSearch }, { title: regSearch }] }).sort({ createdAt: -1 }).limit(+limit!);

    res.status(200).json({
        data: { items: data, total },
    });
});

export const moderationDeleteMany = catchAsync(async (req, res) => {
    const { type } = req.query;
    const { ids } = req.body;
    let query: any = Story.deleteMany({ _id: { $in: ids } });

    if (type === 'notifications') query = Notification.deleteMany({ _id: { $in: ids } });
    if (type === 'topics') query = Topic.deleteMany({ _id: { $in: ids } });
    if (type === 'categories') query = Category.deleteMany({ _id: { $in: ids } });
    await query;

    res.status(204).json({
        status: 'ok',
    });
});

// multer configuration
const storage = multer.diskStorage({
    destination: (req: Request, file: any, cb: any) => {
        const { path } = req.query;
        cb(null, `../../site/public/img/${path || ''}`);
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.split('/')[1];
        cb(null, `img-${req.user!.id}-${Date.now()}.${ext}`);
    },
});

const multerFilter = (req: Request, file: any, cb: any) => {
    if (file.mimetype.startsWith('image') || file.mimetype.startsWith('video')) {
        cb(null, true);
    } else {
        return cb(new AppError('Файл не является изображением!', 400), false);
    }
};

const upload = multer({
    storage,
    fileFilter: multerFilter,
});

// Upload image

export const uploadImage = upload.single('file');

export const returnImage = catchAsync(async (req, res) => {
    const { path } = req.query;
    res.status(200).json({
        status: 'success',
        data: {
            filename: req.file!.filename,
            location: `https://192.168.0.100/site/public/img/${path ? `${path}/` : ''}${req.file!.filename}`,
        },
    });
});
