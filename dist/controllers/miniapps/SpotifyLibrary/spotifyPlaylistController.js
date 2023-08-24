"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePlaylist = exports.getPlaylist = exports.getPlaylists = exports.importPlaylist = void 0;
/* eslint-disable no-console */
const axios_1 = __importDefault(require("axios"));
const AppError_1 = __importDefault(require("../../../utils/AppError"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const spotifyPlaylistModel_1 = __importDefault(require("../../../models/miniapps/SpotifyLibrary/spotifyPlaylistModel"));
const spotifyTrackModel_1 = __importDefault(require("../../../models/miniapps/SpotifyLibrary/spotifyTrackModel"));
const configurationModel_1 = __importDefault(require("../../../models/configurationModel"));
const error404 = new AppError_1.default('Такого плейлиста не существует!', 404);
exports.importPlaylist = (0, catchAsync_1.default)(async (req, res, next) => {
    const { playlistId } = req.body;
    if (!playlistId)
        return next(new AppError_1.default('Необходимо указать Playlist ID плейилста из Spotify', 400));
    const getToken = await configurationModel_1.default.findOne({ appId: 3 }, { 'settings.token': 1 });
    const { token } = getToken.settings;
    const importedPlaylist = await axios_1.default.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
        .catch((err) => next(new AppError_1.default(`Ошибка импортирование плейлиста!, ${err}`, 400)));
    const { id, images, name, uri } = importedPlaylist.data;
    const newPlaylist = await spotifyPlaylistModel_1.default.create({ id, name, uri, image: images[0].url });
    res.status(200).json({
        status: 'ok',
        message: 'Плейлист успешно создан!',
        data: newPlaylist,
    });
});
exports.getPlaylists = (0, catchAsync_1.default)(async (req, res) => {
    const playlists = await spotifyPlaylistModel_1.default.aggregate([
        { $lookup: {
                from: 'spotify_tracks',
                localField: 'id',
                foreignField: 'playlists.id',
                as: 'tracks',
            } },
        { $addFields: { tracks: { $size: '$tracks' } } },
    ]);
    const total = await spotifyPlaylistModel_1.default.countDocuments();
    res.status(200).json({
        status: 'ok',
        data: {
            total,
            items: playlists,
        },
    });
});
exports.getPlaylist = (0, catchAsync_1.default)(async (req, res, next) => {
    const { playlistId } = req.params;
    if (!playlistId)
        return next(new AppError_1.default('Необходимо указать ID плейлиста', 400));
    const playlist = await spotifyPlaylistModel_1.default.findOne({ id: playlistId });
    if (!playlist)
        return next(error404);
    res.status(200).json({
        status: 'ok',
        data: playlist,
    });
});
exports.updatePlaylist = (0, catchAsync_1.default)(async (req, res, next) => {
    const { playlistId } = req.body;
    if (!playlistId)
        return next(new AppError_1.default('Необходимо указать ID плейлиста', 400));
    const getToken = await configurationModel_1.default.findOne({ appId: 3 });
    const { token } = getToken.settings;
    let connectionUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`;
    if (playlistId === 'favorite')
        connectionUrl = 'https://api.spotify.com/v1/me/tracks?limit=50';
    let newTracks = [];
    // Import tracks from Spotify
    const importTracks = async (url) => {
        const receivedTracks = await axios_1.default.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .catch((err) => console.log('Ошибка получения плейлиста от Spotify!', err));
        const { items, next: nextUrl } = receivedTracks.data;
        newTracks = [...newTracks, ...items];
        if (nextUrl)
            return importTracks(nextUrl);
        handleTracks();
    };
    // Update existing track
    const updateTrack = async (trackId, addedAt) => {
        await spotifyTrackModel_1.default.findOneAndUpdate({ id: trackId }, {
            $addToSet: { playlists: { id: playlistId, addedAt } },
        });
    };
    // Find removed tracks from library
    const findRemovedTracks = async (oldTr, newTr) => {
        const newIds = newTr.map((track) => track.track.id);
        const oldIds = oldTr.map((track) => track.id);
        const notFound = [];
        oldIds.map((id) => {
            if (!newIds.includes(id))
                notFound.push(id);
        });
        notFound.map(async (id) => {
            const track = await spotifyTrackModel_1.default.findOne({ id });
            if (track?.playlists.length === 1)
                return spotifyTrackModel_1.default.deleteOne({ id });
            await spotifyTrackModel_1.default.findOneAndUpdate({ id }, {
                $pull: { playlists: { id: playlistId } },
            });
        });
    };
    // Handle every received track
    const handleTracks = async () => {
        const oldTracks = await spotifyTrackModel_1.default.find({ 'playlists.id': playlistId });
        newTracks.map(async (track) => {
            const trackData = {
                ...track.track,
                artist: track.track.artists[0].name,
                duration: track.track.duration_ms,
                album: track.track.album.name,
                img: track.track.album.images[0].url,
                playlists: [{ id: playlistId, addedAt: track.added_at }],
            };
            await spotifyTrackModel_1.default.create(trackData)
                .catch((err) => err.code === 11000 ? updateTrack(track.track.id, track.added_at) : null);
        });
        if (oldTracks.length !== newTracks.length)
            findRemovedTracks(oldTracks, newTracks);
    };
    importTracks(connectionUrl); // initiates task
    res.status(200).json({
        status: 'ok',
        message: 'Импортирование треков...',
    });
});
