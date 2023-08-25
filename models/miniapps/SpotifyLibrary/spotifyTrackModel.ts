import { Schema, model } from 'mongoose';

export interface ISpotifyTrack {
    id: string;
    href: string;
    uri: string;
    name: string;
    album: string;
    artist: string;
    duration: Date;
    img: string;
    playlists: object[];
    importedAt: Date;
}

const spotifyTrackSchema: Schema<ISpotifyTrack> = new Schema({
    id: {
        type: String,
        unique: true,
    },
    href: String,
    uri: String,
    name: String,
    album: String,
    artist: String,
    duration: Date,
    img: String,
    playlists: [Object],
    importedAt: {
        type: Date,
        default: Date.now,
    },
}, { autoIndex: true });

const SpotifyTrack = model<ISpotifyTrack>('spotify_track', spotifyTrackSchema);

export default SpotifyTrack;
