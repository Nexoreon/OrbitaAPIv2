import crypto from 'crypto';
import { Types, Schema, model } from 'mongoose';
import slugify from 'slugify';

export interface ITopic {
    _id: Types.ObjectId;
    name: string;
    authorId: Types.ObjectId;
    tags: string[];
    flags: {
        pinned: boolean;
        important: boolean;
        locked: boolean;
        archived: boolean;
    };
    icon: {
        name: string;
        type: string;
    };
    url: string;
    posts: Types.ObjectId[];
    postsCounter: number;
    mainPost: Types.ObjectId;
    importantPost: Types.ObjectId | undefined;
    views: number;
    parentId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const topicSchema: Schema<ITopic> = new Schema({
    name: {
        type: String,
        required: [true, 'Необходимо указать название темы'],
    },
    authorId: {
        type: Schema.Types.ObjectId,
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
    mainPost: Types.ObjectId,
    importantPost: Types.ObjectId,
    views: {
        type: Number,
        default: 0,
    },
    parentId: {
        type: Schema.Types.ObjectId,
        ref: 'forum_categories',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: Date,
});

topicSchema.pre('save', async function (next) {
    if (!this.isNew) return next();

    const randomUrl = `${this.name}-${crypto.randomBytes(3).toString('hex')}`;
    this.url = slugify(randomUrl, {
        replacement: '-',
        lower: true,
    });
    next();
});

const Topic = model<ITopic>('forum_topic', topicSchema);

export default Topic;
