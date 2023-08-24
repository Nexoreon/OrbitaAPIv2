"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gamesController_1 = require("../../controllers/miniapps/MultiTracker/gamesController");
const authController_1 = require("../../controllers/authController");
const tvShowsController_1 = require("../../controllers/miniapps/MultiTracker/tvShowsController");
const router = (0, express_1.Router)();
// Games
router.route('/games')
    .get(authController_1.protect, gamesController_1.getGames)
    .post(authController_1.protect, gamesController_1.createGame);
router.get('/games/getGameByUrl', authController_1.protect, gamesController_1.getGameByUrl);
router.patch('/games/markGame', authController_1.protect, gamesController_1.markGame);
router.route('/games/:gameId')
    .get(authController_1.protect, gamesController_1.getGame)
    .patch(authController_1.protect, gamesController_1.updateGame)
    .delete(authController_1.protect, gamesController_1.deleteGame);
// TV Shows
router.route('/tv')
    .get(authController_1.protect, tvShowsController_1.getTVShows)
    .post(authController_1.protect, tvShowsController_1.createTVShow);
router.get('/tv/getTVShowByUrl', authController_1.protect, tvShowsController_1.getTVShowByUrl);
router.patch('/tv/markTVShow', authController_1.protect, tvShowsController_1.markTVShow);
router.route('/tv/:tvShowId')
    .get(authController_1.protect, tvShowsController_1.getTVShow)
    .patch(authController_1.protect, tvShowsController_1.updateTVShow)
    .delete(authController_1.protect, tvShowsController_1.deleteTVShow);
exports.default = router;
