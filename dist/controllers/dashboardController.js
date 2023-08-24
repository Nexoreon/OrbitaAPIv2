"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardData = void 0;
/* eslint-disable import/prefer-default-export */
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const topicModel_1 = __importDefault(require("../models/forum/topicModel"));
const gameModel_1 = __importDefault(require("../models/miniapps/MultiTracker/gameModel"));
const tvShowModel_1 = __importDefault(require("../models/miniapps/MultiTracker/tvShowModel"));
const spotifyTrackModel_1 = __importDefault(require("../models/miniapps/SpotifyLibrary/spotifyTrackModel"));
const storyModel_1 = __importDefault(require("../models/storyModel"));
const twitchWatchlistModel_1 = __importDefault(require("../models/miniapps/Twitch/twitchWatchlistModel"));
exports.getDashboardData = (0, catchAsync_1.default)(async (req, res) => {
    const latestTopics = await topicModel_1.default.aggregate([
        {
            $sort: { updatedAt: -1 },
        },
        {
            $limit: 7,
        },
        {
            $lookup: {
                from: 'users',
                localField: 'authorId',
                foreignField: '_id',
                as: 'author',
            },
        },
        {
            $unwind: '$author',
        },
        {
            $project: {
                _id: 1,
                name: 1,
                url: 1,
                icon: 1,
                createdAt: 1,
                'author.name': 1,
            },
        },
    ]);
    const games = await gameModel_1.default.find().sort({ 'flags.pinned': -1, addedAt: -1 }).limit(10);
    const tvShows = await tvShowModel_1.default.find().sort({ 'flags.pinned': -1, addedAt: -1 }).limit(10);
    const tracks = await spotifyTrackModel_1.default.find().limit(7).sort({ importedAt: -1 });
    const articles = await storyModel_1.default.find({ visible: true, showAt: { $lte: Date.now() }, hideAt: { $gte: Date.now() } }).sort({ createdAt: -1 });
    let watchlist = [];
    if (process.env.REMOTEDB_ONLINE === '1') {
        watchlist = await twitchWatchlistModel_1.default.aggregate([
            { $match: { 'flags.isSuggestion': false } },
            { $lookup: {
                    from: 'ma_twitch-watchlists',
                    localField: '_id',
                    foreignField: 'relatedTo',
                    as: 'parts',
                } },
            { $sort: { priority: -1 } },
            { $limit: 7 },
        ]);
    }
    res.status(200).json({
        status: 'ok',
        data: { latestTopics, watchlist, games, tvShows, tracks, articles },
    });
});
