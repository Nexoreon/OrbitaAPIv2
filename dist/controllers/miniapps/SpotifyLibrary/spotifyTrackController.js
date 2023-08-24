"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrack = exports.getTracks = exports.createTrack = void 0;
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const AppError_1 = __importDefault(require("../../../utils/AppError"));
const spotifyTrackModel_1 = __importDefault(require("../../../models/miniapps/SpotifyLibrary/spotifyTrackModel"));
const spotifyPlaylistModel_1 = __importDefault(require("../../../models/miniapps/SpotifyLibrary/spotifyPlaylistModel"));
exports.createTrack = (0, catchAsync_1.default)(async (req, res) => {
    const newTrack = await spotifyTrackModel_1.default.create(req.body);
    res.status(201).json({
        status: 'ok',
        data: newTrack,
    });
});
exports.getTracks = (0, catchAsync_1.default)(async (req, res) => {
    const { playlistId, sortBy, search, limit } = req.query;
    if (typeof sortBy !== 'string' || typeof limit !== 'string')
        return;
    const searchVal = new RegExp(search, 'i');
    const searchPlaylist = playlistId || 'favorite';
    let playlistData;
    if (playlistId)
        playlistData = await spotifyPlaylistModel_1.default.findOne({ id: playlistId });
    const total = await spotifyTrackModel_1.default.countDocuments();
    const playlistTotal = await spotifyTrackModel_1.default.countDocuments({ 'playlists.id': searchPlaylist, name: searchVal });
    const tracks = await spotifyTrackModel_1.default.aggregate([
        { $match: { 'playlists.id': searchPlaylist, name: searchVal } },
        { $unwind: '$playlists' },
        { $match: { 'playlists.id': searchPlaylist, name: searchVal } },
        { $sort: { [sortBy.includes('-') ? sortBy.substring(1) : sortBy]: sortBy.includes('-') ? -1 : 1 } },
        { $limit: +limit },
    ]);
    res.status(200).json({
        status: 'ok',
        data: { total, playlistTotal, data: playlistData, items: tracks },
    });
});
exports.getTrack = (0, catchAsync_1.default)(async (req, res, next) => {
    const track = await spotifyTrackModel_1.default.findById(req.params.id);
    if (!track)
        return next(new AppError_1.default('Такого трека не найдено в датабазе!', 404));
    res.status(200).json({
        status: 'ok',
        data: track,
    });
});
