import { PipelineSource } from 'stream';
import { Document, Types } from 'mongoose';
import { sendError, updateAchievementProgress } from '../utils/common';
import catchAsync from '../utils/catchAsync';
import Achievement, { IAchievement } from '../models/achievements/achievementModel';
import AchievementProgress from '../models/achievements/achievementProgressModel';
import { IMongoDBError } from './errorHandler';

// possible errors
const sendError404 = sendError('Такого достижения не существует!', 404);

export const createAchievement = catchAsync(async (req, res) => {
    const newAchievement = await Achievement.create(req.body);

    res.status(201).json({
        status: 'ok',
        data: newAchievement,
    });
});

export const getAchievements = catchAsync(async (req, res) => {
    const achievements = await Achievement.find();
    const total = await Achievement.countDocuments();

    res.status(200).json({
        status: 'ok',
        data: {
            total,
            items: achievements,
        },
    });
});

export const getAchievement = catchAsync(async (req, res, next) => {
    const { achievementId } = req.params;
    const { _id: userId } = req.user!;

    let achievement: PipelineSource<IAchievement> | Document<IAchievement>;
    const checkProgress = await Achievement.aggregate([
        { $match: { _id: new Types.ObjectId(achievementId) } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $match: { 'user.userId': userId } },
    ]);

    if (!checkProgress.length) {
        achievement = await Achievement.findById(achievementId).select({ user: 0 });
    } else {
        achievement = await Achievement.aggregate([
            { $match: { _id: new Types.ObjectId(achievementId) } },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            { $match: { 'user.userId': userId } },
        ]);
    }

    if (!achievement || Array.isArray(achievement) && !achievement.length) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        data: Array.isArray(achievement) && achievement[0] || achievement,
    });
});

export const updateAchievement = catchAsync(async (req, res, next) => {
    const { achievementId } = req.params;
    const achievement = await Achievement.findByIdAndUpdate(achievementId, req.body, { new: true });
    if (!achievement) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        data: achievement,
    });
});

export const deleteAchievement = catchAsync(async (req, res, next) => {
    const { achievementId } = req.params;
    const achievement = await Achievement.findByIdAndDelete(achievementId);
    if (!achievement) return next(sendError404);

    // delete progress
    await AchievementProgress.deleteMany({ achievementId });

    res.status(204).json({
        status: 'ok',
        message: 'Достижение успешно удалено',
    });
});

export const getUserAchievements = catchAsync(async (req, res) => {
    const { _id: userId } = req.user!;
    const { category, status } = req.query;
    let statusQuery: object = {};

    if (status === 'received') statusQuery = { 'user.progress': 100 };
    if (status === 'notReceived') statusQuery = { $or: [{ 'user.progress': { $exists: false } }, { 'user.progress': { $lt: 100 } }] };
    if (status === 'inProcess') statusQuery = { $and: [{ 'user.progress': { $gt: 0 } }, { 'user.progress': { $ne: 100 } }] };

    const query = {
        ...(category && { category }),
        'flags.available': true,
    };

    const achievements = await Achievement.aggregate([
        { $match: query },
        { $match: status ? { 'user.userId': userId } : {} },
        { $match: statusQuery },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $match: { 'user.userId': userId } },
    ]);
    const noStatsAchievements = await Achievement.aggregate([
        { $match: { ...query, 'user.userId': { $ne: userId } } },
        { $match: statusQuery },
        { $project: { user: 0 } },
    ]);
    const total = achievements.length + noStatsAchievements.length;

    const categories = await Achievement.aggregate([
        { $group: { _id: null, categories: { $addToSet: '$category' } } },
        { $sort: { categories: -1 } },
        { $project: { _id: 0, categories: 1 } },
    ]);

    res.status(200).json({
        status: 'ok',
        data: {
            total,
            items: [...noStatsAchievements, ...achievements],
            categories: categories[0].categories,
        },
    });
});

export const updateProgress = catchAsync(async (req, res) => {
    const { achievementId, incPoints, rewardNow } = req.body;
    const { _id: userId } = req.user!;
    await updateAchievementProgress(userId, achievementId, incPoints, rewardNow)
    .then(() => {
        res.status(200).json({
            status: 'ok',
            message: 'Прогресс достижения успешно обновлён для этого пользователя!',
        });
    })
    .catch((err: IMongoDBError) => {
        res.status(err.code).json({
            status: 'fail',
            message: 'Ошибка во время обновления прогресса достижения!',
        });
    });
});
