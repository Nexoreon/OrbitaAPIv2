import Game from '../../../models/miniapps/MultiTracker/gameModel';
import catchAsync from '../../../utils/catchAsync';
import { sendError } from '../../../utils/common';

// POSSIBLE ERRORS
const sendError404 = sendError('Такой игры не найдено!', 404);
const sendParamNotFound = sendError('Необходимо указать ID игры!', 400);
const sendActionParamNotFound = sendError('Необходимо указать тип действия!', 400);

export const createGame = catchAsync(async (req, res) => {
    const newGame = await Game.create(req.body);

    res.status(201).json({
        status: 'ok',
        data: newGame,
    });
});

export const getGames = catchAsync(async (req, res) => {
    const { search, sort, status, list, limit } = req.query;
    const searchQuery: object = {
        ...(search && { name: { $regex: search, $options: 'i' } }),
        ...(!['all', 'favorite'].includes(status as string) && { status }),
        ...(status === 'favorite' && { 'flags.favorite': true }),
        ...(list && { list: { $in: list } }),
    };

    const games = await Game.find(searchQuery)
    .sort(sort ? { 'flags.pinned': -1, [sort as string]: sort !== 'name' ? -1 : 1 } : { 'flags.pinned': -1, addedAt: -1 })
    .limit(+limit!);

    const total = await Game.countDocuments(searchQuery);

    res.status(200).json({
        status: 'ok',
        data: {
            total,
            items: games,
        },
    });
});

export const getGame = catchAsync(async (req, res, next) => {
    const { gameId } = req.params;
    if (!gameId) return next(sendParamNotFound);

    const game = await Game.findById({ _id: gameId });
    if (!game) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        data: game,
    });
});

export const getGameByUrl = catchAsync(async (req, res, next) => {
    const { gameUrl } = req.query;
    if (!gameUrl) return next(sendParamNotFound);

    const game = await Game.findOne({ url: gameUrl });
    if (!game) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        data: game,
    });
});

export const markGame = catchAsync(async (req, res, next) => {
    const { gameId, action } = req.query;
    if (!action) return next(sendActionParamNotFound);

    const game = await Game.findById({ _id: gameId });
    if (!game) return next(sendError404);

    await Game.findByIdAndUpdate({ _id: gameId }, {
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

export const updateGame = catchAsync(async (req, res, next) => {
    const { gameId } = req.params;
    if (!gameId) return next(sendParamNotFound);

    const game = await Game.findByIdAndUpdate({ _id: gameId }, req.body);
    if (!game) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        message: 'Игра успешно обновлена!',
    });
});

export const deleteGame = catchAsync(async (req, res, next) => {
    const { gameId } = req.params;
    if (!gameId) return next(sendParamNotFound);

    const game = await Game.findByIdAndDelete({ _id: gameId });
    if (!game) return next(sendError404);

    res.status(204).json({
        status: 'ok',
        message: 'Игра успешно удалена!',
    });
});
