/* eslint-disable no-console */
import TwitchNotification, { ITwitchNotification } from '../../models/miniapps/Twitch/twitchNotificationModel';
import Notification from '../../models/notificationModel';

export default async () => {
    const twitchNotifications = await TwitchNotification.find().sort({ createdAt: 1 });

    twitchNotifications.map(async (ntf: ITwitchNotification) => {
        await Notification.create({
            ...ntf._doc,
            app: {
                name: 'Twitch Hub',
                icon: 'https://192.168.0.100/site/MiniApps/TwitchStreamers/icon.jpg',
            },
        })
        .catch((err) => console.log('[TASK: Import Twitch Notifications]: Ошибка импортирования уведомления', err));
    });

    await TwitchNotification.deleteMany();
};
