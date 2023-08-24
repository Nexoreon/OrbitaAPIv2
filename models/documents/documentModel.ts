/* eslint-disable object-shorthand */
import { Schema, model } from 'mongoose';
import slugify from 'slugify';

export interface IDocument {
    title: string,
    url: string,
    category: string,
    flags: {
        important: boolean,
        outdated: boolean,
    },
    meta: {
        createdAt: Date,
        updatedAt: Date,
    },
}

const documentSchema: Schema<IDocument> = new Schema({
    title: {
        type: String,
        required: [true, 'Название материала не может быть пустым'],
        unique: true,
    },
    url: {
        type: String,
        default: function () {
            return slugify(this.title);
        },
    },
    category: {
        type: String,
        required: [true, 'Материал не может быть без категории'],
    },
    flags: {
        important: {
            type: Boolean,
            default: false,
        },
        outdated: {
            type: Boolean,
            default: false,
        },
    },
    meta: {
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: Date,
    },
});

const Document = model<IDocument>('doc', documentSchema);

export default Document;
