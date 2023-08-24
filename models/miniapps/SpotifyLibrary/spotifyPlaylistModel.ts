import { Schema, model } from 'mongoose';

export interface ISpotifyPlaylist {
    id: string,
    name: string,
    image: string,
    uri: string,
    addedAt: Date
}

const spotifyPlaylistSchema: Schema<ISpotifyPlaylist> = new Schema({
    id: {
        type: String,
        required: [true, 'Необходимо указать Playlist ID из Spotify'],
        unique: true,
    },
    name: {
        type: String,
        required: [true, 'Необходимо указать название плейлиста'],
    },
    image: String,
    uri: String,
    addedAt: {
        type: Date,
        default: Date.now,
    },
});

const SpotifyPlaylist = model<ISpotifyPlaylist>('spotify_playlist', spotifyPlaylistSchema);

export default SpotifyPlaylist;
