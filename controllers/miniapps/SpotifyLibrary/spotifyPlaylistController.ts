/* eslint-disable no-console */
import axios from 'axios';
import AppError from '../../../utils/AppError';
import catchAsync from '../../../utils/catchAsync';

import SpotifyPlaylist from '../../../models/miniapps/SpotifyLibrary/spotifyPlaylistModel';
import SpotifyTrack, { ISpotifyTrackPlaylist } from '../../../models/miniapps/SpotifyLibrary/spotifyTrackModel';
import Application from '../../../models/configurationModel';

const error404 = new AppError('Такого плейлиста не существует!', 404);

export const importPlaylist = catchAsync(async (req, res, next) => {
    const { playlistId } = req.body;
    if (!playlistId) return next(new AppError('Необходимо указать Playlist ID плейилста из Spotify', 400));

    const getToken = await Application.findOne({ appId: 3 }, { 'settings.token': 1 });
    const { token } = getToken!.settings;

    const importedPlaylist = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
    .catch((err) => next(new AppError(`Ошибка импортирование плейлиста!, ${err}`, 400)));

    const { id, images, name, uri } = importedPlaylist!.data;
    const newPlaylist = await SpotifyPlaylist.create({ id, name, uri, image: images[0].url });

    res.status(200).json({
        status: 'ok',
        message: 'Плейлист успешно создан!',
        data: newPlaylist,
    });
});

export const getPlaylists = catchAsync(async (req, res) => {
    const playlists = await SpotifyPlaylist.aggregate([
        { $lookup: {
            from: 'spotify_tracks',
            localField: 'id',
            foreignField: 'playlists.id',
            as: 'tracks',
        } },
        { $addFields: { tracks: { $size: '$tracks' } } },
    ]);
    const total = await SpotifyPlaylist.countDocuments();

    res.status(200).json({
        status: 'ok',
        data: {
            total,
            items: playlists,
        },
    });
});

export const getPlaylist = catchAsync(async (req, res, next) => {
    const { playlistId } = req.params;
    if (!playlistId) return next(new AppError('Необходимо указать ID плейлиста', 400));

    const playlist = await SpotifyPlaylist.findOne({ id: playlistId });
    if (!playlist) return next(error404);

    res.status(200).json({
        status: 'ok',
        data: playlist,
    });
});

export const updatePlaylist = catchAsync(async (req, res, next) => {
    const { playlistId } = req.body;
    if (!playlistId) return next(new AppError('Необходимо указать ID плейлиста', 400));

    const getToken = await Application.findOne({ appId: 3 });
    const { token } = getToken!.settings;

    let connectionUrl: string = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`;
    if (playlistId === 'favorite') connectionUrl = 'https://api.spotify.com/v1/me/tracks?limit=50';
    let newTracks: { track: { [key: string]: any }, added_at: Date }[] = [];

    // Import tracks from Spotify
    const importTracks = async (url: string): Promise<void> => {
        const receivedTracks = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        .catch((err) => console.log('Ошибка получения плейлиста от Spotify!', err.response));

        const { items, next: nextUrl } = receivedTracks!.data;
        newTracks = [...newTracks, ...items];

        if (nextUrl) return importTracks(nextUrl);
        handleTracks();
    };

    // Update existing track
    const updateTrack = async (trackId: string, addedAt: Date) => {
        const track = await SpotifyTrack.findOne({ id: trackId });
        if (!track) return;
        const playlistExists = track.playlists.map((p: ISpotifyTrackPlaylist) => p.id).includes(playlistId);
        const timings = track.playlists.filter((p: ISpotifyTrackPlaylist) => {
            const test: any = new Date(p.addedAt).toISOString(); // TODO: IMPROVE
            return test === new Date(addedAt).toISOString();
        });

        // Prevent from duplicating in the same playlist
        if (timings.length) {
            if (!timings.length) {
                return SpotifyTrack.findOneAndUpdate({ id: trackId, 'playlists.id': playlistId }, {
                    $set: { 'playlists.$.addedAt': addedAt },
                });
            }
            return;
        }

        await SpotifyTrack.findOneAndUpdate({ id: trackId }, {
            $addToSet: { playlists: { id: playlistId, addedAt } },
        });
    };

    // Find removed tracks from library
    const findRemovedTracks = async (oldTr: { id: string }[], newTr: { [key: string]: any }[]) => {
        const newIds = newTr.map((track) => track.track.id);
        const oldIds = oldTr.map((track) => track.id);
        const notFound: string[] = [];

        oldIds.map((id: string) => {
            if (!newIds.includes(id)) notFound.push(id);
        });

        notFound.map(async (id: string) => {
            const track = await SpotifyTrack.findOne({ id });

            if (track?.playlists.length === 1) return SpotifyTrack.deleteOne({ id });
            await SpotifyTrack.findOneAndUpdate({ id }, {
                $pull: { playlists: { id: playlistId } },
            });
        });
    };

    // Handle every received track
    const handleTracks = async () => {
        const oldTracks = await SpotifyTrack.find({ 'playlists.id': playlistId });
        newTracks.map(async (track) => {
            const trackData = {
                ...track.track,
                artist: track.track.artists[0].name,
                duration: track.track.duration_ms,
                album: track.track.album.name,
                img: track.track.album.images[0].url,
                playlists: [{ id: playlistId, addedAt: track.added_at }],
            };

            await SpotifyTrack.create(trackData)
            .catch((err) => {
                if (err.code === 11000) updateTrack(track.track.id, track.added_at);
            });
        });

        if (oldTracks.length !== newTracks.length) findRemovedTracks(oldTracks, newTracks);
    };

    importTracks(connectionUrl); // initiates task

    res.status(200).json({
        status: 'ok',
        message: 'Импортирование треков...',
    });
});
