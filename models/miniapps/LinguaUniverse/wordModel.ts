import { Types, Schema, model } from 'mongoose';

export interface IWord {
    word: string;
    translation: string[];
    transcription: string;
    pronunciation: string;
    letters: object[];
    learned_by: Types.ObjectId[];
    users: Types.ObjectId[];
    wordSets: Types.ObjectId[];
    added_by: Types.ObjectId;
    added_at: Date;
}

const wordSchema: Schema<IWord> = new Schema({
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
        type: [Schema.Types.ObjectId],
        ref: 'User',
    },
    users: {
        type: [Schema.Types.ObjectId],
        ref: 'User',
    },
    wordSets: {
        type: [Schema.Types.ObjectId],
        ref: 'linguauniverse_wordset',
    },
    added_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    added_at: {
        type: Date,
        default: Date.now,
    },
});

wordSchema.pre('save', function (next) {
    if (!this.isNew || !this.isModified('word')) return next();
    const letters = this.word.split('');
    const insertedLetters: string[] = [];
    const newLetters: { letter: string, position: number | number[] }[] = [];

    letters.map((letter: string, index: number) => {
        if (!insertedLetters.includes(letter)) {
            insertedLetters.push(letter);
            newLetters.push({
                letter,
                position: index,
            });
        } else {
            newLetters.map((ltr) => {
                if (ltr.letter === letter && Array.isArray(ltr.position)) {
                    ltr.position = [...ltr.position, index];
                } else if (ltr.letter === letter && !Array.isArray(ltr.position)) {
                    ltr.position = [ltr.position, index];
                }
            });
        }
    });

    this.letters = newLetters;
    next();
});

const Word = model<IWord>('linguauniverse_word', wordSchema);

export default Word;
