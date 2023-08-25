import { Types, Schema, model } from 'mongoose';

export interface IWordSet {
    name: string;
    img: string;
    words: Types.ObjectId[];
    owner: Types.ObjectId;
    users: Types.ObjectId[];
    createdAt: Date;
}

const wordSetSchema: Schema<IWordSet> = new Schema({
    name: {
        type: String,
        required: [true, 'Необходимо заполнить название группы слов'],
    },
    img: {
        type: String,
        default: 'wordSetDefault.png',
    },
    words: {
        type: [Schema.Types.ObjectId],
        ref: 'linguauniverse_word',
    },
    owner: {
        type: Schema.Types.ObjectId,
        required: [true, 'Набор слов должен иметь ID создателя'],
        ref: 'Users',
    },
    users: {
        type: [Schema.Types.ObjectId],
        ref: 'Users',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const WordSet = model<IWordSet>('linguauniverse_wordset', wordSetSchema);

export default WordSet;
