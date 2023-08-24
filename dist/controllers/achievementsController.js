"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProgress = exports.getUserAchievements = exports.deleteAchievement = exports.updateAchievement = exports.getAchievement = exports.getAchievements = exports.createAchievement = void 0;
const mongoose_1 = require("mongoose");
const common_1 = require("../utils/common");
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const achievementModel_1 = __importDefault(require("../models/achievements/achievementModel"));
const achievementProgressModel_1 = __importDefault(require("../models/achievements/achievementProgressModel"));
// possible errors
const sendError404 = (0, common_1.sendError)('Такого достижения не существует!', 404);
exports.createAchievement = (0, catchAsync_1.default)(async (req, res) => {
    const newAchievement = await achievementModel_1.default.create(req.body);
    res.status(201).json({
        status: 'ok',
        data: newAchievement,
    });
});
exports.getAchievements = (0, catchAsync_1.default)(async (req, res) => {
    const achievements = await achievementModel_1.default.find();
    const total = await achievementModel_1.default.countDocuments();
    res.status(200).json({
        status: 'ok',
        data: {
            total,
            items: achievements,
        },
    });
});
exports.getAchievement = (0, catchAsync_1.default)(async (req, res, next) => {
    const { achievementId } = req.params;
    const { _id: userId } = req.user;
    const achievement = await achievementModel_1.default.aggregate([
        { $match: { _id: new mongoose_1.Types.ObjectId(achievementId) } },
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
    if (!achievement.length)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        data: achievement[0],
    });
});
exports.updateAchievement = (0, catchAsync_1.default)(async (req, res, next) => {
    const { achievementId } = req.params;
    const achievement = await achievementModel_1.default.findByIdAndUpdate(achievementId, req.body, { new: true });
    if (!achievement)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        data: achievement,
    });
});
exports.deleteAchievement = (0, catchAsync_1.default)(async (req, res, next) => {
    const { achievementId } = req.params;
    const achievement = await achievementModel_1.default.findByIdAndDelete(achievementId);
    if (!achievement)
        return next(sendError404);
    // delete progress
    await achievementProgressModel_1.default.deleteMany({ achievementId });
    res.status(204).json({
        status: 'ok',
        message: 'Достижение успешно удалено',
    });
});
exports.getUserAchievements = (0, catchAsync_1.default)(async (req, res) => {
    const { _id: userId } = req.user;
    const { category, status } = req.query;
    let statusQuery = {};
    if (status === 'received')
        statusQuery = { 'completion.received': true };
    if (status === 'notReceived')
        statusQuery = { $or: [{ completion: { $exists: false } }, { 'completion.received': false }] };
    if (status === 'inProcess')
        statusQuery = { $and: [{ 'completion.progress': { $gt: 0 } }, { 'completion.received': false }] };
    const query = {
        ...(category && { category }),
        'flags.available': true,
    };
    const achievements = await achievementModel_1.default.aggregate([
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
        { $match: statusQuery },
    ]);
    const total = achievements.length;
    const categoriesItems = await achievementModel_1.default.aggregate([
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
exports.updateProgress = (0, catchAsync_1.default)(async (req, res) => {
    const { achievementId, incPoints, rewardNow } = req.body;
    const { _id: userId } = req.user;
    await (0, common_1.updateAchievementProgress)(userId, achievementId, incPoints, rewardNow)
        .then(() => {
        res.status(200).json({
            status: 'ok',
            message: 'Прогресс достижения успешно обновлён для этого пользователя!',
        });
    })
        .catch((err) => {
        res.status(err.code).json({
            status: 'fail',
            message: 'Ошибка во время обновления прогресса достижения!',
        });
    });
});
