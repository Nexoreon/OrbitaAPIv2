/* eslint-disable import/prefer-default-export */
import catchAsync from '../utils/catchAsync';

import Topic from '../models/forum/topicModel';
import Game from '../models/miniapps/MultiTracker/gameModel';
import TVShow from '../models/miniapps/MultiTracker/tvShowModel';
import SpotifyTrack from '../models/miniapps/SpotifyLibrary/spotifyTrackModel';
import Story from '../models/storyModel';
import TwitchWatchlist, { ITwitchWatchlist } from '../models/miniapps/Twitch/twitchWatchlistModel';

export const getDashboardData = catchAsync(async (req, res) => {
    const latestTopics = await Topic.aggregate([
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
    const games = await Game.find().sort({ 'flags.pinned': -1, addedAt: -1 }).limit(10);
    const tvShows = await TVShow.find().sort({ 'flags.pinned': -1, addedAt: -1 }).limit(10);
    const tracks = await SpotifyTrack.find().limit(7).sort({ importedAt: -1 });
    const articles = await Story.find({ visible: true, showAt: { $lte: Date.now() }, hideAt: { $gte: Date.now() } }).sort({ createdAt: -1 });

    let watchlist: ITwitchWatchlist[] = [];
    if (process.env.REMOTEDB_ONLINE === '1') {
        watchlist = await TwitchWatchlist.aggregate([
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
