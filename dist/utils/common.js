"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserProgress = exports.updateAchievementProgress = exports.sendDelayedNotification = exports.sendNotification = exports.createNotification = exports.sendError = exports.toObjectId = void 0;
/* eslint-disable no-console */
const mongoose_1 = __importDefault(require("mongoose"));
const node_schedule_1 = __importDefault(require("node-schedule"));
const chalk_1 = __importDefault(require("chalk"));
const beamsClient_1 = __importDefault(require("./beamsClient"));
const AppError_1 = __importDefault(require("./AppError"));
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
const achievementModel_1 = __importDefault(require("../models/achievements/achievementModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const toObjectId = (id) => new mongoose_1.default.Types.ObjectId(id);
exports.toObjectId = toObjectId;
const sendError = (msg, statusCode) => new AppError_1.default(msg, statusCode);
exports.sendError = sendError;
// CREATE APP NOTIFICATION
const createNotification = async (data) => {
    await notificationModel_1.default.create(data)
        .then(() => console.log(chalk_1.default.green('[Система уведомлений]: Уведомление успешно добавлено в приложение!')))
        .catch((err) => console.log(chalk_1.default.red('[Система уведомлений]: Ошибка добавления уведомления в приложение!'), err));
};
exports.createNotification = createNotification;
// SEND PUSH NOTIFICATION
const sendNotification = ({ title, message, link, icon }) => {
    beamsClient_1.default.publishToInterests(['project'], {
        web: {
            notification: {
                title,
                body: message,
                deep_link: link,
                icon,
            },
        },
    })
        .then(() => console.log('[Pusher]: Уведомление успешно отправлено!'))
        .catch((err) => console.log(chalk_1.default.red('[Pusher]: Ошибка отправки уведомления!'), err));
};
exports.sendNotification = sendNotification;
// SEND DELAYED NOTIFICATION
const sendDelayedNotification = ({ title, content, link, image, app, sendOut }) => {
    node_schedule_1.default.scheduleJob(sendOut, () => {
        const icon = image || app.icon;
        beamsClient_1.default.publishToInterests(['project'], {
            web: {
                notification: {
                    title,
                    body: content,
                    deep_link: link,
                    icon: icon || '',
                },
            },
        })
            .then(() => console.log('[Pusher]: Уведомление успешно отравлено!'))
            .catch((err) => console.log(chalk_1.default.red('[Pusher]: Ошибка отправки уведомления!'), err));
    });
    console.log(chalk_1.default.blueBright(`[Система уведомлений]: Отправка запланирована ${new Date(sendOut).toLocaleString()}`));
};
exports.sendDelayedNotification = sendDelayedNotification;
// UPDATE ACHIEVEMENT PROGRESS FOR SPECIFIC USER
const updateAchievementProgress = async (uId, aId, addPoints, rewardNow) => {
    const achievementId = (0, exports.toObjectId)(aId);
    const userId = typeof uId === 'string' ? (0, exports.toObjectId)(uId) : uId;
    if (!addPoints && !rewardNow)
        return console.log('Невозможно наградить пользователя без указания метода награждения!');
    // GET USER PROGRESS FOR THIS ACHIEVEMENT
    const achievement = await achievementModel_1.default.findById({ _id: achievementId });
    if (!achievement)
        return console.log('Такого достижения не существует!');
    const findProgress = { _id: achievementId, 'user.userId': userId };
    const achievementProgress = await achievementModel_1.default.findOne(findProgress).select({ user: 1 });
    if (achievementProgress && achievementProgress.user[0].progress === 100)
        return console.log('Этот пользователь уже получил это достижение ранее!');
    const userProgress = achievementProgress && achievementProgress.user[0];
    // UPDATE PROGRESS OR CREATE PROGRESS FOR THIS USER
    if (achievement.pointsRequired) {
        let points;
        let progress;
        const countProgress = async (newPoints) => {
            // eslint-disable-next-line no-new
            new Promise((resolve) => {
                points = newPoints || +addPoints;
                progress = (100 / achievement.pointsRequired) * points;
                if (progress > 100)
                    progress = 100;
                if (rewardNow) {
                    points = achievement.pointsRequired;
                    progress = 100;
                }
                if (progress === 100 && achievement.reward)
                    (0, exports.updateUserProgress)(userId, achievementId);
                resolve();
            });
        };
        if (userProgress && userProgress.points) {
            countProgress(userProgress.points + +addPoints > achievement.pointsRequired ? achievement.pointsRequired : userProgress.points + +addPoints)
                .then(async () => {
                await achievementModel_1.default.findOneAndUpdate({ _id: achievementId, 'user.userId': userId }, {
                    $set: { user: { userId, points, progress, ...(progress === 100 && ({ receivedAt: Date.now() })) } },
                });
            });
        }
        else {
            countProgress()
                .then(async () => {
                await achievementModel_1.default.findByIdAndUpdate({ _id: achievementId }, {
                    $addToSet: { user: { userId, points, progress, ...(progress === 100 && ({ receivedAt: Date.now() })) } },
                });
            });
        }
    }
    else {
        await achievementModel_1.default.findByIdAndUpdate({ _id: achievementId }, { $addToSet: { user: { userId, progress: 100, receivedAt: Date.now() } } });
        (0, exports.updateUserProgress)(userId, achievementId);
    }
};
exports.updateAchievementProgress = updateAchievementProgress;
// UPDATE USER PROGRESS (XP, LEVEL AND STORE POINTS)
const updateUserProgress = async (userId, achievementId) => {
    if (!achievementId)
        return console.log('Невозможно наградить пользователя без ID достижений!');
    const achievement = await achievementModel_1.default.findById({ _id: achievementId });
    if (!achievement)
        return console.log('Такого достижения не существует!');
    const user = await userModel_1.default.findById({ _id: userId });
    if (!user)
        return console.log('Такого пользователя не существует!');
    if (achievement.reward?.xp) {
        const updatedXp = achievement.reward.xp + user.level.xp;
        if (updatedXp >= user.level.xpRequired) {
            // await StoreClient.findOneAndUpdate({ relatedTo: userId }, {
            //     $inc: { 'points.amount': user.level.reward },
            //     $push: { 'points.history': { action: 'increase', amount: user.level.reward, reason: 'Повышение уровня', changedAt: Date.now() }}
            // });
            await userModel_1.default.findByIdAndUpdate({ _id: userId }, {
                $inc: { 'level.current': 1, 'level.xpRequired': 50 },
                $set: { 'level.xp': 0 },
            });
        }
        else {
            await userModel_1.default.findByIdAndUpdate({ _id: userId }, {
                $set: { 'level.xp': updatedXp },
            });
        }
    }
    // if (achievement.reward?.points) {
    //     await StoreClient.findOneAndUpdate({ relatedTo: userId }, {
    //         $inc: { 'points.amount': achievement.reward.points },
    //         $push: { 'points.history': { action: 'increase', amount: achievement.reward.points, reason: `Выполнение достижения: ${achievement.name}`, changedAt: Date.now() }}
    //     });
    // }
};
exports.updateUserProgress = updateUserProgress;
