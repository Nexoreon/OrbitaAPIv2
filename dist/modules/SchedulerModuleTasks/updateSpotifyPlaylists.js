"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const axios_1 = __importDefault(require("axios"));
const chalk_1 = __importDefault(require("chalk"));
const configurationModel_1 = __importDefault(require("../../models/configurationModel"));
const spotifyPlaylistModel_1 = __importDefault(require("../../models/miniapps/SpotifyLibrary/spotifyPlaylistModel"));
const spotifyTrackModel_1 = __importDefault(require("../../models/miniapps/SpotifyLibrary/spotifyTrackModel"));
exports.default = async () => {
    console.log(chalk_1.default.green('[Spotify Library]: Запуск процесса обновления плейлистов...'));
    const playlists = await spotifyPlaylistModel_1.default.find({}, { id: 1 });
    const allPlaylists = [{ id: 'favorite' }, ...playlists];
    const executeUpdate = async (playlistId) => {
        console.log(playlistId);
        const getToken = await configurationModel_1.default.findOne({ appId: 3 }, { 'settings.token': 1 });
        const { token } = getToken.settings;
        if (!token)
            return console.log(chalk_1.default.red('[Spotify Library]: Отсутствует токен для проведения операции! Операция была отменена'));
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
                .catch((err) => console.log('[Spotify Library]: Ошибка получения данных с сервера', err));
            const { items, next } = receivedTracks.data;
            newTracks = [...newTracks, ...items];
            if (next)
                return importTracks(next);
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
    };
    allPlaylists.map(async (playlist) => {
        await executeUpdate(playlist.id);
    });
    console.log(chalk_1.default.green('[Spotify Library]: Плейлисты успешно обновлены!'));
};
