/* eslint-disable no-console */
import axios from 'axios';
import chalk from 'chalk';
import Configuration from '../../models/configurationModel';
import SpotifyPlaylist from '../../models/miniapps/SpotifyLibrary/spotifyPlaylistModel';
import SpotifyTrack from '../../models/miniapps/SpotifyLibrary/spotifyTrackModel';

export default async () => {
    console.log(chalk.green('[Spotify Library]: Запуск процесса обновления плейлистов...'));
    const playlists = await SpotifyPlaylist.find({}, { id: 1 });
    const allPlaylists = [{ id: 'favorite' }, ...playlists];

    const executeUpdate = async (playlistId: string) => {
        console.log(playlistId);
        const getToken = await Configuration.findOne({ appId: 3 }, { 'settings.token': 1 });
        const { token } = getToken!.settings;
        if (!token) return console.log(chalk.red('[Spotify Library]: Отсутствует токен для проведения операции! Операция была отменена'));

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
            .catch((err) => console.log('[Spotify Library]: Ошибка получения данных с сервера', err));

            const { items, next } = receivedTracks!.data;
            newTracks = [...newTracks, ...items];

            if (next) return importTracks(next);
            handleTracks();
        };

        // Update existing track
        const updateTrack = async (trackId: string, addedAt: Date) => {
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
                .catch((err) => err.code === 11000 ? updateTrack(track.track.id, track.added_at) : null);
            });

            if (oldTracks.length !== newTracks.length) findRemovedTracks(oldTracks, newTracks);
        };

        importTracks(connectionUrl); // initiates task
    };

    allPlaylists.map(async (playlist) => {
        await executeUpdate(playlist.id);
    });
    console.log(chalk.green('[Spotify Library]: Плейлисты успешно обновлены!'));
};
