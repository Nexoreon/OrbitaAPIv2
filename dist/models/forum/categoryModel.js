"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
const slugify_1 = __importDefault(require("slugify"));
const categorySchema = new mongoose_1.default.Schema({
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
    parentId: mongoose_1.default.Types.ObjectId,
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
    if (!this.isNew)
        return next();
    const randomUrl = `${this.name}-${crypto_1.default.randomBytes(3).toString('hex')}`;
    this.url = (0, slugify_1.default)(randomUrl, {
        replacement: '-',
        lower: true,
    });
    next();
});
const Category = mongoose_1.default.model('forum_category', categorySchema);
exports.default = Category;
