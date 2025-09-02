"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const slugify_1 = __importDefault(require("slugify"));
const gameSchema = new mongoose_1.default.Schema({
    id: Number,
    url: {
        type: String,
        unique: true,
    },
    name: {
        type: String,
        required: [true, 'Необходимо указать название игры'],
        unique: true,
    },
    description: {
        type: String,
        default: 'Описание для этой игры отсутствует',
    },
    releaseDate: Date,
    rating: {
        type: Number,
        min: 1,
        max: 10,
    },
    review: String,
    image: {
        box: String,
        logo: String,
        background: String,
    },
    status: {
        type: String,
        required: [true, 'Укажите статус прохождения игры'],
        enum: ['completed', 'playing', 'next', 'waiting', 'unknown'],
    },
    list: [String],
    flags: {
        pinned: {
            type: Boolean,
            default: false,
        },
        favorite: {
            type: Boolean,
            default: false,
        },
    },
    updatedAt: Date,
    addedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
gameSchema.pre('save', function () {
    this.url = (0, slugify_1.default)(this.name).toLowerCase();
});
gameSchema.virtual('flags.released').get(function () {
    return new Date(this.releaseDate) < new Date();
});
const Game = mongoose_1.default.model('db_game', gameSchema);
exports.default = Game;
