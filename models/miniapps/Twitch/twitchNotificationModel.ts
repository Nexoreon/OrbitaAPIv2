import { Types, Schema } from 'mongoose';
import remoteDB from '../../../remoteDB';

export interface ITwitchNotification {
    _doc: object;
    createdAt: Date;
    sendOut: Date;
    title: string;
    content: string;
    image: string;
    link: string;
    receivers: Types.ObjectId[];
    readBy: Types.ObjectId[];
    hiddenFor: Types.ObjectId[];
}

const twitchNotificationSchema: Schema<ITwitchNotification> = new Schema({
    createdAt: {
        type: Date,
        default: Date.now,
    },
    sendOut: {
        type: Date,
        required: [true, 'Необходимо указать дату отправки уведомления'],
    },
    title: {
        type: String,
        required: [true, 'Необходимо указать заголовок уведомления'],
    },
    content: {
        type: String,
        required: [true, 'Необходимо указать содержимое уведомления'],
    },
    image: String,
    link: String,
    receivers: [Schema.Types.ObjectId],
    readBy: [Schema.Types.ObjectId],
    hiddenFor: [Schema.Types.ObjectId],
});

const TwitchNotification = remoteDB.model<ITwitchNotification>('th_notifications', twitchNotificationSchema);

export default TwitchNotification;
