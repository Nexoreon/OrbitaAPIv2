"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const achievementProgressSchema = new mongoose_1.Schema({
    achievementId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: [true, 'Необходимо указать ID достижения'],
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
const AchievementProgress = (0, mongoose_1.model)('achievements_progress', achievementProgressSchema);
exports.default = AchievementProgress;
