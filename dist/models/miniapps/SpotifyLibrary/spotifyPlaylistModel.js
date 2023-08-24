"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const spotifyPlaylistSchema = new mongoose_1.Schema({
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
const SpotifyPlaylist = (0, mongoose_1.model)('spotify_playlist', spotifyPlaylistSchema);
exports.default = SpotifyPlaylist;
