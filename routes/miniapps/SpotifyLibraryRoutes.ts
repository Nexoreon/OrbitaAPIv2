import { Router } from 'express';
import { protect } from '../../controllers/authController';
import { getAuthToken, getToken } from '../../controllers/miniapps/SpotifyLibrary/spotifyLibraryController';
import { createTrack, getTrack, getTracks } from '../../controllers/miniapps/SpotifyLibrary/spotifyTrackController';
import { getPlaylists, getPlaylist, updatePlaylist, importPlaylist } from '../../controllers/miniapps/SpotifyLibrary/spotifyPlaylistController';

const router = Router();

router.get('/playlists', protect, getPlaylists);
router.post('/playlists/importPlaylist', protect, importPlaylist);
router.patch('/playlists/updatePlaylist', protect, updatePlaylist);
router.get('/playlists/:playlistId', protect, getPlaylist);

router.route('/')
.get(protect, getTracks)
.post(protect, createTrack);
router.get('/getToken', protect, getToken, getAuthToken);
router.get('/:id', protect, getTrack);

export default router;
