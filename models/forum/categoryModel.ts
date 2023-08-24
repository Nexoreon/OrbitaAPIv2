import crypto from 'crypto';
import mongoose from 'mongoose';
import slugify from 'slugify';

export interface ICategory {
    name: string,
    description: string,
    section: string,
    parentId: mongoose.Types.ObjectId,
    icon: {
        name: string,
        type: string,
        color: string,
        background: string,
        img?: string,
    },
    flags: {
        allowSubCategories: boolean,
        isLink: boolean
    },
    link: string,
    subCategories: mongoose.Types.ObjectId[],
    topics: mongoose.Types.ObjectId[],
    createdAt: Date,
    url: string
}

const categorySchema: mongoose.Schema<ICategory> = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Имя категории не может быть пустым'],
        unique: true,
    },
    description: {
        type: String,
        required: [true, 'Категория должна иметь описание'],
    },
    section: {
        type: String,
        default: 'Общее',
    },
    parentId: mongoose.Types.ObjectId,
    icon: {
        name: {
            type: String,
            default: 'comments',
        },
        type: {
            type: String,
            default: 'far',
        },
        color: {
            type: String,
            default: '#fffff',
        },
        background: {
            type: String,
            default: 'linear-gradient(180deg, rgba(130,130,130,1) 0%, rgba(29,29,26,1) 95%)',
        },
        img: String,
    },
    flags: {
        allowSubCategories: {
            type: Boolean,
            default: false,
        },
        isLink: {
            type: Boolean,
            default: false,
        },
    },
    link: String,
    subCategories: Array,
    topics: Array,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    url: String,
});

categorySchema.pre('save', function (next) {
    if (!this.isNew) return next();

    const randomUrl = `${this.name}-${crypto.randomBytes(3).toString('hex')}`;
    this.url = slugify(randomUrl, {
        replacement: '-',
        lower: true,
    });
    next();
});

const Category = mongoose.model<ICategory>('forum_category', categorySchema);

export default Category;
