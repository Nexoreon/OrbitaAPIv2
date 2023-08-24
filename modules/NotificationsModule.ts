/* eslint-disable no-console */
import chalk from 'chalk';
import Notification from '../models/notificationModel';
import { sendDelayedNotification } from '../utils/common';

export default async () => {
    try {
        const delayedNotifications = await Notification.find({ sendOut: { $gte: Date.now() } });
        if (!delayedNotifications.length) return console.log(chalk.blueBright('[Система уведомлений]: Уведомлений для отложенной отправки не найдены'));
        console.log(chalk.blueBright('[Система уведомлений]: Найдены уведомления для будущей отправки'));
        delayedNotifications.map((ntf) => {
            sendDelayedNotification(ntf);
        });
    } catch (e) {
        console.log(chalk.red('[Система уведомлений]: Ошибка планировки отправки уведомлений!'), e);
    }
};
