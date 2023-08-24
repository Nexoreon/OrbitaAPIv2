"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const slugify_1 = __importDefault(require("slugify"));
const tvShowSchema = new mongoose_1.default.Schema({
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
    this.url = (0, slugify_1.default)(this.name).toLowerCase();
});
tvShowSchema.virtual('flags.released').get(function () {
    return new Date(this.released) < new Date();
});
const TVShow = mongoose_1.default.model('db_tvshow', tvShowSchema);
exports.default = TVShow;
