import { Types, Schema, model } from 'mongoose';

interface IAchievementProgress {
    achievementId: Types.ObjectId;
    userId: Types.ObjectId;
    progress: number;
    points: number;
    received: boolean;
    startedAt: Date;
}

const achievementProgressSchema: Schema<IAchievementProgress> = new Schema({
    achievementId: {
        type: Schema.Types.ObjectId,
        required: [true, 'Необходимо указать ID достижения'],
    },
    userId: {
        type: Schema.Types.ObjectId,
        required: [true, 'Необходимо указать ID пользователя'],
    },
    progress: Number,
    points: Number,
    received: {
        type: Boolean,
        default: false,
    },
    startedAt: {
        type: Date,
        default: Date.now,
    },
}, { collection: 'achievements_progress ' });

const AchievementProgress = model<IAchievementProgress>('achievements_progress', achievementProgressSchema);

export default AchievementProgress;
