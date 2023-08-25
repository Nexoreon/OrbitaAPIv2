import { Types, Schema } from 'mongoose';
import remoteDB from '../../../remoteDB';

export interface ITwitchWatchlist {
    id: string;
    relatedTo: Types.ObjectId;
    platform: string;
    title: string;
    author: string;
    url: string;
    thumbnail: string;
    meta: {
        streamDate: Date;
        followers: number;
    };
    games: string[];
    priority: number;
    notes: string;
    duration: string;
    flags: {
        isAvailable: boolean;
        isSuggestion: boolean;
        isShortTerm: boolean;
        watchLater: boolean;
    };
    sortDate: Date;
    addedAt: Date;
    updatedAt: Date;
}

const twitchWatchlistSchema: Schema<ITwitchWatchlist> = new Schema({
    id: {
        type: String,
        required: [true, 'Видео должно иметь ID с платформы'],
        unique: true,
    },
    relatedTo: Schema.Types.ObjectId,
    platform: {
        type: String,
        enum: ['Twitch', 'YouTube'],
        required: [true, 'Укажите платформу на которой расположено это видео'],
        default: 'Twitch',
    },
    title: {
        type: String,
        required: [true, 'Укажите название видео'],
    },
    author: {
        type: String,
        required: [true, 'Укажите имя автора или стримера'],
    },
    url: {
        type: String,
        required: [true, 'Укажите ссылку на видео'],
    },
    thumbnail: String,
    meta: {
        streamDate: Date,
        followers: Number,
    },
    games: {
        type: [String],
        required: [true, 'Укажите название игр'],
    },
    priority: {
        type: Number,
        min: 1,
        max: 100,
    },
    notes: String,
    duration: String,
    flags: {
        isAvailable: {
            type: Boolean,
            default: true,
        },
        isSuggestion: {
            type: Boolean,
            default: false,
        },
        isShortTerm: Boolean,
        watchLater: Boolean,
    },
    sortDate: {
        type: Date,
        default: Date.now,
    },
    addedAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: Date,
});

const TwitchWatchlist = remoteDB.model<ITwitchWatchlist>('ma_twitch-watchlist', twitchWatchlistSchema);

export default TwitchWatchlist;
