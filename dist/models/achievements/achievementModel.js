"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const achievementSchema = new mongoose_1.Schema({
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
const Achievement = (0, mongoose_1.model)('achievement', achievementSchema);
exports.default = Achievement;
