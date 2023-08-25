import { Types, Schema, model } from 'mongoose';

export interface IPost {
    authorId: Types.ObjectId;
    data: string;
    relatedTo: Types.ObjectId;
    main: boolean;
    flags: {
        hidden: boolean;
        important: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}

const postSchema = new Schema<IPost>({
    authorId: {
        type: Schema.Types.ObjectId,
        required: [true, 'Пост должен иметь автора'],
    },
    data: {
        type: String,
        required: [true, 'Пост должен иметь контент'],
    },
    relatedTo: {
        type: Schema.Types.ObjectId,
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

const Post = model<IPost>('forum_post', postSchema);

export default Post;
