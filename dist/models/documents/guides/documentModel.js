"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable object-shorthand */
const mongoose_1 = require("mongoose");
const slugify_1 = __importDefault(require("slugify"));
const documentSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Название материала не может быть пустым'],
        unique: true,
    },
    url: {
        type: String,
        default: function () {
            return (0, slugify_1.default)(this.title);
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
const Document = (0, mongoose_1.model)('doc', documentSchema);
exports.default = Document;
