import { Types } from 'mongoose';
import { sendError, updateAchievementProgress } from '../utils/common';
import catchAsync from '../utils/catchAsync';
import Achievement from '../models/achievements/achievementModel';
import AchievementProgress from '../models/achievements/achievementProgressModel';
import { IResponseError } from './errorHandler';

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

    const achievement = await Achievement.aggregate([
        { $match: { _id: new Types.ObjectId(achievementId) } },
        { $lookup: {
            from: 'achievements_progress',
            let: { achievementId: '$_id', userId },
            pipeline: [
                { $match: { $expr: { $eq: ['$achievementId', '$$achievementId'] }, userId } },
            ],
            as: 'completion',
        } },
        { $unwind: { path: '$completion', preserveNullAndEmptyArrays: true } },
    ]);

    if (!achievement.length) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        data: achievement[0],
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

    if (status === 'received') statusQuery = { 'completion.received': true };
    if (status === 'notReceived') statusQuery = { $or: [{ completion: { $exists: false } }, { 'completion.received': false }] };
    if (status === 'inProcess') statusQuery = { $and: [{ 'completion.progress': { $gt: 0 } }, { 'completion.received': false }] };

    const query = {
        ...(category && { category }),
        'flags.available': true,
    };

    const achievements = await Achievement.aggregate([
        { $match: query },
        { $lookup: {
            from: 'achievements_progress',
            let: { achievementId: '$_id' },
            pipeline: [
                { $match: { userId, $expr: { $eq: ['$achievementId', '$$achievementId'] } } },
            ],
            as: 'completion',
        } },
        { $unwind: { path: '$completion', preserveNullAndEmptyArrays: true } },
        { $match: statusQuery! },
    ]);
    const total = achievements.length;

    const categoriesItems = await Achievement.aggregate([
        { $project: { category: 1 } },
    ]);
    const categories = [...new Set(categoriesItems.map((item) => item.category))];

    res.status(200).json({
        status: 'ok',
        data: {
            total,
            items: achievements,
            categories,
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
    .catch((err: IResponseError) => {
        res.status(err.code).json({
            status: 'fail',
            message: 'Ошибка во время обновления прогресса достижения!',
        });
    });
});
