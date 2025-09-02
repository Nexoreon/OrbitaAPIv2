import mongoose from 'mongoose';
import slugify from 'slugify';

interface IGame {
    id: number;
    url: string;
    name: string;
    description: string;
    releaseDate: Date;
    rating: number;
    review: string;
    image: {
        box: string;
        logo: string;
        background: string;
    };
    status: string;
    list: string[];
    flags: {
        pinned: boolean;
        favorite: boolean;
    };
    updatedAt: Date;
    addedAt: Date;
}

const gameSchema: mongoose.Schema<IGame> = new mongoose.Schema({
    id: Number,
    url: {
        type: String,
        unique: true,
    },
    name: {
        type: String,
        required: [true, 'Необходимо указать название игры'],
        unique: true,
    },
    description: {
        type: String,
        default: 'Описание для этой игры отсутствует',
    },
    releaseDate: Date,
    rating: {
        type: Number,
        min: 1,
        max: 10,
    },
    review: String,
    image: {
        box: String,
        logo: String,
        background: String,
    },
    status: {
        type: String,
        required: [true, 'Укажите статус прохождения игры'],
        enum: ['completed', 'playing', 'next', 'waiting', 'unknown'],
    },
    list: [String],
    flags: {
        pinned: {
            type: Boolean,
            default: false,
        },
        favorite: {
            type: Boolean,
            default: false,
        },
    },
    updatedAt: Date,
    addedAt: {
        type: Date,
        default: Date.now,
    },
},
{
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

gameSchema.pre('save', function () {
    this.url = slugify(this.name).toLowerCase();
});

gameSchema.virtual('flags.released').get(function () {
    return new Date(this.releaseDate) < new Date();
});

const Game = mongoose.model<IGame>('db_game', gameSchema);

export default Game;
