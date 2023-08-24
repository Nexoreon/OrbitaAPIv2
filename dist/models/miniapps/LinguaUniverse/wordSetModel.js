"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const wordSetSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Необходимо заполнить название группы слов'],
    },
    img: {
        type: String,
        default: 'wordSetDefault.png',
    },
    words: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: 'linguauniverse_word',
    },
    owner: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: [true, 'Набор слов должен иметь ID создателя'],
        ref: 'Users',
    },
    users: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: 'Users',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
const WordSet = (0, mongoose_1.model)('linguauniverse_wordset', wordSetSchema);
exports.default = WordSet;
