"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const wordSchema = new mongoose_1.Schema({
    word: {
        type: String,
        required: [true, 'Необходимо ввести слово для добавления'],
        unique: true,
    },
    translation: {
        type: [String],
        required: [true, 'Невозможно добавить слово без введенного перевода'],
    },
    transcription: {
        type: String,
        select: false,
    },
    pronunciation: {
        type: String,
        select: false,
    },
    letters: [Object],
    learned_by: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: 'User',
    },
    users: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: 'User',
    },
    wordSets: {
        type: [mongoose_1.Schema.Types.ObjectId],
        ref: 'linguauniverse_wordset',
    },
    added_by: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    added_at: {
        type: Date,
        default: Date.now,
    },
});
wordSchema.pre('save', function (next) {
    if (!this.isNew || !this.isModified('word'))
        return next();
    const letters = this.word.split('');
    const insertedLetters = [];
    const newLetters = [];
    letters.map((letter, index) => {
        if (!insertedLetters.includes(letter)) {
            insertedLetters.push(letter);
            newLetters.push({
                letter,
                position: index,
            });
        }
        else {
            newLetters.map((ltr) => {
                if (ltr.letter === letter && Array.isArray(ltr.position)) {
                    ltr.position = [...ltr.position, index];
                }
                else if (ltr.letter === letter && !Array.isArray(ltr.position)) {
                    ltr.position = [ltr.position, index];
                }
            });
        }
    });
    this.letters = newLetters;
    next();
});
const Word = (0, mongoose_1.model)('linguauniverse_word', wordSchema);
exports.default = Word;
