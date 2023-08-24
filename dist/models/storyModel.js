"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const storySchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Необходимо заполнить заголовок новости'],
    },
    img: String,
    width: {
        type: Number,
        default: 150,
    },
    modal: {
        title: {
            type: String,
            required: [true, 'Необходимо заполнить заголовок'],
        },
        text: {
            type: String,
            required: [true, 'Необходимо заполнить описание новости'],
        },
    },
    button: {
        label: String,
        link: String,
    },
    visible: {
        type: Boolean,
        default: false,
    },
    showAt: {
        type: Date,
        default: Date.now,
    },
    hideAt: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
const Story = (0, mongoose_1.model)('dashboard_article', storySchema);
exports.default = Story;
