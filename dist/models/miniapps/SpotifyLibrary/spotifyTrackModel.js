"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const spotifyTrackSchema = new mongoose_1.Schema({
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
    playlists: [{
            id: String,
            addedAt: Date,
        }],
    importedAt: {
        type: Date,
        default: Date.now,
    },
}, { autoIndex: true });
const SpotifyTrack = (0, mongoose_1.model)('spotify_track', spotifyTrackSchema);
exports.default = SpotifyTrack;
