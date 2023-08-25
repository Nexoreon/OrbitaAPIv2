import mongoose from 'mongoose';
import slugify from 'slugify';

interface ITVShow {
    name: string;
    image: string;
    released: Date;
    status: string;
    rating: number;
    tracking: {
        season: number;
        episode: number;
    };
    url: string;
    nextSeasonRelease: Date;
    flags: {
        pinned: boolean;
    };
    addedAt: Date;
}

const tvShowSchema: mongoose.Schema<ITVShow> = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Укажите название сериала'],
    },
    image: String,
    released: Date,
    status: String,
    rating: Number,
    tracking: {
        season: Number,
        episode: Number,
    },
    url: String,
    nextSeasonRelease: Date,
    flags: {
        pinned: {
            type: Boolean,
            default: false,
        },
    },
    addedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

tvShowSchema.pre('save', function () {
    this.url = slugify(this.name).toLowerCase();
});

tvShowSchema.virtual('flags.released').get(function () {
    return new Date(this.released) < new Date();
});

const TVShow = mongoose.model<ITVShow>('db_tvshow', tvShowSchema);

export default TVShow;
