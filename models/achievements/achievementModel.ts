import { Schema, model } from 'mongoose';

interface IAchievement {
    name: string,
    description: string,
    image: string,
    background: string,
    category: string,
    tags: string[],
    pointsRequired: number,
    reward: {
        points: number,
        xp: number,
    },
    flags: {
        available: boolean,
        enableImageFrame: boolean,
    },
    createdAt: Date,
}

const achievementSchema: Schema<IAchievement> = new Schema({
    name: {
        type: String,
        required: [true, 'Укажите название достижения'],
    },
    description: {
        type: String,
        required: [true, 'Укажите описание достижения'],
    },
    image: String,
    background: {
        type: String,
        default: 'linear-gradient(180deg, #177ddc, #202020 120%)',
    },
    category: {
        type: String,
        required: [true, 'Укажите категорию достижения'],
    },
    tags: [String],
    pointsRequired: Number,
    reward: {
        points: Number,
        xp: Number,
    },
    flags: {
        available: {
            type: Boolean,
            default: true,
        },
        enableImageFrame: {
            type: Boolean,
            default: true,
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Achievement = model<IAchievement>('achievement', achievementSchema);

export default Achievement;
