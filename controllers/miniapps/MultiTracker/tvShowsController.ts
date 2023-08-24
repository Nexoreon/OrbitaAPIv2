import TVShow from '../../../models/miniapps/MultiTracker/tvShowModel';
import catchAsync from '../../../utils/catchAsync';
import { sendError } from '../../../utils/common';

// possible errors
const sendError404 = sendError('Такого сериала не найдено в системе!', 404);
const sendParamNotFound = sendError('Необходимо указать ID сериала!', 400);
const sendUrlParamNotFound = sendError('Необходимо указать ссылку на сериал!', 400);
const sendActionParamNotFound = sendError('Необходимо указать тип действия!', 400);

export const getTVShows = catchAsync(async (req, res) => {
    const { search, sort, status, limit } = req.query;
    const searchQuery = {
        ...(search && { name: { $regex: search, $options: 'i' } }),
        ...(!['all'].includes(status as string) && { status }),
    };

    const tvShows = await TVShow.find(searchQuery)
    .sort(sort ? { 'flags.pinned': -1, [sort as string]: sort !== 'name' ? -1 : 1 } : { 'flags.pinned': -1, addedAt: -1 })
    .limit(+limit!);
    const total = await TVShow.countDocuments(searchQuery);

    res.status(200).json({
        status: 'ok',
        data: { items: tvShows, total },
    });
});

export const getTVShow = catchAsync(async (req, res, next) => {
    const { tvShowId } = req.params;
    if (!tvShowId) return next(sendParamNotFound);

    const tvShow = await TVShow.findById(tvShowId);
    if (!tvShow) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        data: tvShow,
    });
});

export const getTVShowByUrl = catchAsync(async (req, res, next) => {
    const { tvShowUrl } = req.query;
    if (!tvShowUrl) return next(sendUrlParamNotFound);

    const tvShow = await TVShow.findOne({ url: tvShowUrl });
    if (!tvShow) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        data: tvShow,
    });
});

export const createTVShow = catchAsync(async (req, res) => {
    const tvShow = await TVShow.create(req.body);

    res.status(201).json({
        status: 'ok',
        data: tvShow,
    });
});

export const updateTVShow = catchAsync(async (req, res, next) => {
    const { tvShowId } = req.params;
    if (!tvShowId) return next(sendParamNotFound);

    const tvShow = await TVShow.findByIdAndUpdate(tvShowId, { ...req.body }, { new: true });
    if (!tvShow) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        data: tvShow,
    });
});

export const markTVShow = catchAsync(async (req, res, next) => {
    const { tvShowId, action } = req.query;
    if (!action) return next(sendActionParamNotFound);

    const tvShow = await TVShow.findById(tvShowId);
    if (!tvShow) return next(sendError404);

    await TVShow.findByIdAndUpdate(tvShowId, {
        $set: {
            ...(action === 'pin' && { 'flags.pinned': !tvShow.flags.pinned }),
        },
    });
});

export const deleteTVShow = catchAsync(async (req, res, next) => {
    const { tvShowId } = req.params;
    if (!tvShowId) return next(sendParamNotFound);

    const tvShow = await TVShow.findByIdAndDelete(tvShowId);
    if (!tvShow) return next(sendError404);

    res.status(204).json({
        status: 'ok',
        message: 'Сериал успешно удалён!',
    });
});
