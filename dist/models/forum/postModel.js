"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const postSchema = new mongoose_1.Schema({
    authorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: [true, 'Пост должен иметь автора'],
    },
    data: {
        type: String,
        required: [true, 'Пост должен иметь контент'],
    },
    relatedTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: [true, 'Пост должен быть привязан к определенной теме'],
    },
    main: {
        type: Boolean,
        default: false,
    },
    flags: {
        hidden: {
            type: Boolean,
            default: false,
        },
        important: {
            type: Boolean,
            default: false,
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: Date,
});
const Post = (0, mongoose_1.model)('forum_post', postSchema);
exports.default = Post;
