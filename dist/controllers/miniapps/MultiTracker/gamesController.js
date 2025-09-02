"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGame = exports.updateGame = exports.markGame = exports.getGameByUrl = exports.getGame = exports.getGames = exports.createGame = void 0;
const gameModel_1 = __importDefault(require("../../../models/miniapps/MultiTracker/gameModel"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const common_1 = require("../../../utils/common");
// POSSIBLE ERRORS
const sendError404 = (0, common_1.sendError)('Такой игры не найдено!', 404);
const sendParamNotFound = (0, common_1.sendError)('Необходимо указать ID игры!', 400);
const sendActionParamNotFound = (0, common_1.sendError)('Необходимо указать тип действия!', 400);
exports.createGame = (0, catchAsync_1.default)(async (req, res) => {
    const newGame = await gameModel_1.default.create(req.body);
    res.status(201).json({
        status: 'ok',
        data: newGame,
    });
});
exports.getGames = (0, catchAsync_1.default)(async (req, res) => {
    const { search, sort, status, list, limit } = req.query;
    const searchQuery = {
        ...(search && { name: { $regex: search, $options: 'i' } }),
        ...(!['all', 'favorite'].includes(status) && { status }),
        ...(status === 'favorite' && { 'flags.favorite': true }),
        ...(list !== 'any' && { list: { $in: list } }),
    };
    const games = await gameModel_1.default.find(searchQuery)
        .sort(sort ? { 'flags.pinned': -1, [sort]: sort !== 'name' ? -1 : 1 } : { 'flags.pinned': -1, addedAt: -1 })
        .limit(+limit);
    const total = await gameModel_1.default.countDocuments(searchQuery);
    res.status(200).json({
        status: 'ok',
        data: {
            total,
            items: games,
        },
    });
});
exports.getGame = (0, catchAsync_1.default)(async (req, res, next) => {
    const { gameId } = req.params;
    if (!gameId)
        return next(sendParamNotFound);
    const game = await gameModel_1.default.findById({ _id: gameId });
    if (!game)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        data: game,
    });
});
exports.getGameByUrl = (0, catchAsync_1.default)(async (req, res, next) => {
    const { gameUrl } = req.query;
    if (!gameUrl)
        return next(sendParamNotFound);
    const game = await gameModel_1.default.findOne({ url: gameUrl });
    if (!game)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        data: game,
    });
});
exports.markGame = (0, catchAsync_1.default)(async (req, res, next) => {
    const { gameId, action } = req.query;
    if (!action)
        return next(sendActionParamNotFound);
    const game = await gameModel_1.default.findById({ _id: gameId });
    if (!game)
        return next(sendError404);
    await gameModel_1.default.findByIdAndUpdate({ _id: gameId }, {
        $set: {
            ...(action === 'pin' && { 'flags.pinned': !game.flags.pinned }),
            ...(action === 'favorite' && { 'flags.favorite': !game.flags.favorite }),
        },
    });
    res.status(200).json({
        status: 'ok',
        message: 'Статус игры успешно изменён',
    });
});
exports.updateGame = (0, catchAsync_1.default)(async (req, res, next) => {
    const { gameId } = req.params;
    if (!gameId)
        return next(sendParamNotFound);
    const game = await gameModel_1.default.findByIdAndUpdate({ _id: gameId }, req.body);
    if (!game)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        message: 'Игра успешно обновлена!',
    });
});
exports.deleteGame = (0, catchAsync_1.default)(async (req, res, next) => {
    const { gameId } = req.params;
    if (!gameId)
        return next(sendParamNotFound);
    const game = await gameModel_1.default.findByIdAndDelete({ _id: gameId });
    if (!game)
        return next(sendError404);
    res.status(204).json({
        status: 'ok',
        message: 'Игра успешно удалена!',
    });
});
