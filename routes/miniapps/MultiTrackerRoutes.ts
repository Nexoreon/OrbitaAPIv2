import { Router } from 'express';
import { createGame, deleteGame, getGame, getGameByUrl, getGames, markGame, updateGame } from '../../controllers/miniapps/MultiTracker/gamesController';
import { protect } from '../../controllers/authController';
import {
    createTVShow,
    deleteTVShow,
    getTVShow,
    getTVShowByUrl,
    getTVShows,
    markTVShow,
    updateTVShow,
} from '../../controllers/miniapps/MultiTracker/tvShowsController';

const router = Router();

// Games
router.route('/games')
.get(protect, getGames)
.post(protect, createGame);

router.get('/games/getGameByUrl', protect, getGameByUrl);
router.patch('/games/markGame', protect, markGame);

router.route('/games/:gameId')
.get(protect, getGame)
.patch(protect, updateGame)
.delete(protect, deleteGame);

// TV Shows
router.route('/tv')
.get(protect, getTVShows)
.post(protect, createTVShow);

router.get('/tv/getTVShowByUrl', protect, getTVShowByUrl);
router.patch('/tv/markTVShow', protect, markTVShow);

router.route('/tv/:tvShowId')
.get(protect, getTVShow)
.patch(protect, updateTVShow)
.delete(protect, deleteTVShow);

export default router;
