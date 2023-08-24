"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable object-shorthand */
const mongoose_1 = require("mongoose");
const slugify_1 = __importDefault(require("slugify"));
const guideSectionSchema = new mongoose_1.Schema({
    guideId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: [true, 'Секция должна быть прикреплена к справочному материалу'],
    },
    anchor: {
        type: String,
        default: function () {
            return (0, slugify_1.default)(this.title).toLowerCase();
        },
    },
    title: {
        type: String,
        required: [true, 'Укажите название секции'],
    },
    meta: {
        createdAt: {
            type: Date,
            default: Date,
        },
        updatedAt: Date,
    },
});
const GuideSection = (0, mongoose_1.model)('guides_section', guideSectionSchema);
exports.default = GuideSection;
