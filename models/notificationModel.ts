import mongoose from 'mongoose';

export interface INotification {
    createdAt: Date,
    sendOut: Date,
    app: {
        name: string,
        icon: string,
        link: string,
    },
    title: string,
    content: string,
    image: string,
    link: string,
    receivers: mongoose.Types.ObjectId[],
    readBy: mongoose.Types.ObjectId[],
    hiddenFor: mongoose.Types.ObjectId[],
}

const notificationSchema: mongoose.Schema<INotification> = new mongoose.Schema({
    createdAt: {
        type: Date,
        default: Date.now,
    },
    sendOut: {
        type: Date,
        required: [true, 'Необходимо указать дату отправки уведомления'],
    },
    app: {
        name: {
            type: String,
            required: [true, 'Необходимо указать название приложения от которого прийдет уведомление'],
        },
        icon: String,
        link: String,
    },
    title: {
        type: String,
        required: [true, 'Необходимо указать заголовок уведомления'],
    },
    content: {
        type: String,
        required: [true, 'Необходимо указать текст уведомления'],
    },
    image: String,
    link: String,
    receivers: [mongoose.Types.ObjectId],
    readBy: [mongoose.Types.ObjectId],
    hiddenFor: [mongoose.Types.ObjectId],
});

const Notification = mongoose.model<INotification>('notification', notificationSchema);

export default Notification;
