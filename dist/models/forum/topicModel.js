"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = require("mongoose");
const slugify_1 = __importDefault(require("slugify"));
const topicSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Необходимо указать название темы'],
    },
    authorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: [true, 'Тема должна иметь автора'],
        ref: 'User',
    },
    tags: Array,
    flags: {
        pinned: {
            type: Boolean,
            default: false,
        },
        important: {
            type: Boolean,
            default: false,
        },
        locked: {
            type: Boolean,
            default: false,
        },
        archived: {
            type: Boolean,
            default: false,
        },
    },
    icon: {
        name: {
            type: String,
            default: 'comments',
        },
        type: {
            type: String,
            default: 'far',
        },
    },
    url: String,
    posts: Array,
    postsCounter: Number,
    mainPost: mongoose_1.Types.ObjectId,
    importantPost: mongoose_1.Types.ObjectId,
    views: {
        type: Number,
        default: 0,
    },
    parentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'forum_categories',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: Date,
});
topicSchema.pre('save', async function (next) {
    if (!this.isNew)
        return next();
    const randomUrl = `${this.name}-${crypto_1.default.randomBytes(3).toString('hex')}`;
    this.url = (0, slugify_1.default)(randomUrl, {
        replacement: '-',
        lower: true,
    });
    next();
});
const Topic = (0, mongoose_1.model)('forum_topic', topicSchema);
exports.default = Topic;
