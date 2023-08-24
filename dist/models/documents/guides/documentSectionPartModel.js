"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable object-shorthand */
const mongoose_1 = require("mongoose");
const slugify_1 = __importDefault(require("slugify"));
const documentSectionPartSchema = new mongoose_1.Schema({
    guideId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: [true, 'Часть секции должна быть прикреплена к материалу'],
    },
    sectionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: [true, 'Часть секции должна быть прикреплена к секции материала'],
    },
    anchor: {
        type: String,
        default: function () {
            return (0, slugify_1.default)(this.title).toLowerCase();
        },
    },
    title: {
        type: String,
        required: [true, 'Часть секции должна иметь название секции'],
    },
    content: {
        type: String,
        required: [true, 'Часть секции не может быть пустой'],
    },
    meta: {
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: Date,
    },
});
const DocumentSectionPart = (0, mongoose_1.model)('docs_section', documentSectionPartSchema);
exports.default = DocumentSectionPart;
