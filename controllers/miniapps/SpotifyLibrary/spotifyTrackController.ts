import catchAsync from '../../../utils/catchAsync';
import AppError from '../../../utils/AppError';
import SpotifyTrack from '../../../models/miniapps/SpotifyLibrary/spotifyTrackModel';
import SpotifyPlaylist from '../../../models/miniapps/SpotifyLibrary/spotifyPlaylistModel';

export const createTrack = catchAsync(async (req, res) => {
    const newTrack = await SpotifyTrack.create(req.body);

    res.status(201).json({
        status: 'ok',
        data: newTrack,
    });
});

export const getTracks = catchAsync(async (req, res) => {
    const { playlistId, sortBy, search, limit } = req.query;
    if (typeof sortBy !== 'string' || typeof limit !== 'string') return;
    const searchVal = new RegExp(search as string, 'i');
    const searchPlaylist = playlistId || 'favorite';

    let playlistData: unknown;
    if (playlistId) playlistData = await SpotifyPlaylist.findOne({ id: playlistId });

    const total = await SpotifyTrack.countDocuments();
    const playlistTotal = await SpotifyTrack.countDocuments({ 'playlists.id': searchPlaylist, name: searchVal });
    const tracks = await SpotifyTrack.aggregate([
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

export const getTrack = catchAsync(async (req, res, next) => {
    const track = await SpotifyTrack.findById(req.params.id);
    if (!track) return next(new AppError('Такого трека не найдено в датабазе!', 404));

    res.status(200).json({
        status: 'ok',
        data: track,
    });
});
