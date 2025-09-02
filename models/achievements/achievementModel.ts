import { Schema, Types, model } from 'mongoose';

export interface IAchievement {
    name: string;
    description: string;
    image: string;
    background: string;
    category: string;
    tags: string[];
    pointsRequired: number;
    reward: {
        points: number;
        xp: number;
    };
    user: {
        userId: Types.ObjectId;
        progress: number;
        points: number | undefined;
        startedAt: Date;
        receivedAt: Date;
    }[];
    flags: {
        available: boolean;
        enableImageFrame: boolean;
    };
    createdAt: Date;
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
    user: [{
        userId: Schema.Types.ObjectId,
        progress: {
            type: Number,
            min: 0,
            max: 100,
        },
        points: Number,
        startedAt: {
            type: Date,
            default: Date.now(),
        },
        receivedAt: Date,
    }],
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
