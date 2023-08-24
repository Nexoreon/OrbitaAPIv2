"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const remoteDB_1 = __importDefault(require("../../../remoteDB"));
const twitchWatchlistSchema = new mongoose_1.Schema({
    id: {
        type: String,
        required: [true, 'Видео должно иметь ID с платформы'],
        unique: true,
    },
    relatedTo: mongoose_1.Schema.Types.ObjectId,
    platform: {
        type: String,
        enum: ['Twitch', 'YouTube'],
        required: [true, 'Укажите платформу на которой расположено это видео'],
        default: 'Twitch',
    },
    title: {
        type: String,
        required: [true, 'Укажите название видео'],
    },
    author: {
        type: String,
        required: [true, 'Укажите имя автора или стримера'],
    },
    url: {
        type: String,
        required: [true, 'Укажите ссылку на видео'],
    },
    thumbnail: String,
    meta: {
        streamDate: Date,
        followers: Number,
    },
    games: {
        type: [String],
        required: [true, 'Укажите название игр'],
    },
    priority: {
        type: Number,
        min: 1,
        max: 100,
    },
    notes: String,
    duration: String,
    flags: {
        isAvailable: {
            type: Boolean,
            default: true,
        },
        isSuggestion: {
            type: Boolean,
            default: false,
        },
        isShortTerm: Boolean,
        watchLater: Boolean,
    },
    sortDate: {
        type: Date,
        default: Date.now,
    },
    addedAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: Date,
});
const TwitchWatchlist = remoteDB_1.default.model('ma_twitch-watchlist', twitchWatchlistSchema);
exports.default = TwitchWatchlist;
