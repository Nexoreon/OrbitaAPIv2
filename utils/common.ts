/* eslint-disable no-console */
import mongoose, { Types } from 'mongoose';
import nodeSchedule from 'node-schedule';
import chalk from 'chalk';
import beamsClient from './beamsClient';
import AppError from './AppError';
import Notification, { INotification } from '../models/notificationModel';
import Achievement from '../models/achievements/achievementModel';
import User from '../models/userModel';

export const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);
export const sendError = (msg: string, statusCode: number) => new AppError(msg, statusCode);

// CREATE APP NOTIFICATION
export const createNotification = async (data: INotification) => {
    await Notification.create(data)
    .then(() => console.log(chalk.green('[Система уведомлений]: Уведомление успешно добавлено в приложение!')))
    .catch((err) => console.log(chalk.red('[Система уведомлений]: Ошибка добавления уведомления в приложение!'), err));
};

// SEND PUSH NOTIFICATION
export const sendNotification = ({ title, message, link, icon }: { title: string, message: string, link: string, icon: string }) => {
    beamsClient.publishToInterests(['project'], {
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
    .catch((err) => console.log(chalk.red('[Pusher]: Ошибка отправки уведомления!'), err));
};

// SEND DELAYED NOTIFICATION
export const sendDelayedNotification = ({ title, content, link, image, app, sendOut }: INotification) => {
    nodeSchedule.scheduleJob(sendOut, () => {
        const icon: string = image || app.icon;
        beamsClient.publishToInterests(['project'], {
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
        .catch((err) => console.log(chalk.red('[Pusher]: Ошибка отправки уведомления!'), err));
    });
    console.log(chalk.blueBright(`[Система уведомлений]: Отправка запланирована ${new Date(sendOut).toLocaleString()}`));
};

// UPDATE ACHIEVEMENT PROGRESS FOR SPECIFIC USER
export const updateAchievementProgress = async (uId: string | Types.ObjectId, aId: string, addPoints: string, rewardNow?: string) => {
    const achievementId = toObjectId(aId)!;
    const userId = typeof uId === 'string' ? toObjectId(uId)! : uId;
    if (!addPoints && !rewardNow) return console.log('Невозможно наградить пользователя без указания метода награждения!');

    // GET USER PROGRESS FOR THIS ACHIEVEMENT
    const achievement = await Achievement.findById({ _id: achievementId });
    if (!achievement) return console.log('Такого достижения не существует!');

    const findProgress = { _id: achievementId, 'user.userId': userId };
    const achievementProgress = await Achievement.findOne(findProgress).select({ user: 1 });
    if (achievementProgress && achievementProgress.user[0].progress === 100) return console.log('Этот пользователь уже получил это достижение ранее!');
    const userProgress = achievementProgress && achievementProgress.user[0];

    // UPDATE PROGRESS OR CREATE PROGRESS FOR THIS USER
    if (achievement.pointsRequired) {
        let points: number;
        let progress: number;

        const countProgress = async (newPoints?: number) => {
            // eslint-disable-next-line no-new
            new Promise<void>((resolve): void => {
                points = newPoints || +addPoints;
                progress = (100 / achievement.pointsRequired) * points;
                if (progress > 100) progress = 100;
                if (rewardNow) {
                    points = achievement.pointsRequired;
                    progress = 100;
                }
                if (progress === 100 && achievement.reward) updateUserProgress(userId, achievementId);
                resolve();
            });
        };

        if (userProgress && userProgress.points) {
            countProgress(userProgress.points + +addPoints > achievement.pointsRequired ? achievement.pointsRequired : userProgress.points + +addPoints)
            .then(async () => {
                await Achievement.findOneAndUpdate({ _id: achievementId, 'user.userId': userId }, {
                    $set: { user: { userId, points, progress, ...(progress === 100 && ({ receivedAt: Date.now() })) } },
                });
            });
        } else {
            countProgress()
            .then(async () => {
                await Achievement.findByIdAndUpdate({ _id: achievementId }, {
                    $addToSet: { user: { userId, points, progress, ...(progress === 100 && ({ receivedAt: Date.now() })) } },
                });
            });
        }
    } else {
        await Achievement.findByIdAndUpdate({ _id: achievementId }, { $addToSet: { user: { userId, progress: 100, receivedAt: Date.now() } } });
        updateUserProgress(userId, achievementId);
    }
};

// UPDATE USER PROGRESS (XP, LEVEL AND STORE POINTS)
export const updateUserProgress = async (userId: Types.ObjectId, achievementId: Types.ObjectId) => {
    if (!achievementId) return console.log('Невозможно наградить пользователя без ID достижений!');

    const achievement = await Achievement.findById({ _id: achievementId });
    if (!achievement) return console.log('Такого достижения не существует!');
    const user = await User.findById({ _id: userId });
    if (!user) return console.log('Такого пользователя не существует!');

    if (achievement.reward?.xp) {
        const updatedXp = achievement.reward.xp + user.level.xp;
        if (updatedXp >= user.level.xpRequired) {
            // await StoreClient.findOneAndUpdate({ relatedTo: userId }, {
            //     $inc: { 'points.amount': user.level.reward },
            //     $push: { 'points.history': { action: 'increase', amount: user.level.reward, reason: 'Повышение уровня', changedAt: Date.now() }}
            // });
            await User.findByIdAndUpdate({ _id: userId }, {
                $inc: { 'level.current': 1, 'level.xpRequired': 50 },
                $set: { 'level.xp': 0 },
            });
        } else {
            await User.findByIdAndUpdate({ _id: userId }, {
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
