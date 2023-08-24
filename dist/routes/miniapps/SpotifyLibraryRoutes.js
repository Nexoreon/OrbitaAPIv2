"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../../controllers/authController");
const spotifyLibraryController_1 = require("../../controllers/miniapps/SpotifyLibrary/spotifyLibraryController");
const spotifyTrackController_1 = require("../../controllers/miniapps/SpotifyLibrary/spotifyTrackController");
const spotifyPlaylistController_1 = require("../../controllers/miniapps/SpotifyLibrary/spotifyPlaylistController");
const router = (0, express_1.Router)();
router.get('/playlists', authController_1.protect, spotifyPlaylistController_1.getPlaylists);
router.post('/playlists/importPlaylist', authController_1.protect, spotifyPlaylistController_1.importPlaylist);
router.patch('/playlists/updatePlaylist', authController_1.protect, spotifyPlaylistController_1.updatePlaylist);
router.get('/playlists/:playlistId', authController_1.protect, spotifyPlaylistController_1.getPlaylist);
router.route('/')
    .get(authController_1.protect, spotifyTrackController_1.getTracks)
    .post(authController_1.protect, spotifyTrackController_1.createTrack);
router.get('/getToken', authController_1.protect, spotifyLibraryController_1.getToken, spotifyLibraryController_1.getAuthToken);
router.get('/:id', authController_1.protect, spotifyTrackController_1.getTrack);
exports.default = router;
