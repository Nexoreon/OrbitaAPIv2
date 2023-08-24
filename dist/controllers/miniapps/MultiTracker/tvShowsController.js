"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTVShow = exports.markTVShow = exports.updateTVShow = exports.createTVShow = exports.getTVShowByUrl = exports.getTVShow = exports.getTVShows = void 0;
const tvShowModel_1 = __importDefault(require("../../../models/miniapps/MultiTracker/tvShowModel"));
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const common_1 = require("../../../utils/common");
// possible errors
const sendError404 = (0, common_1.sendError)('Такого сериала не найдено в системе!', 404);
const sendParamNotFound = (0, common_1.sendError)('Необходимо указать ID сериала!', 400);
const sendUrlParamNotFound = (0, common_1.sendError)('Необходимо указать ссылку на сериал!', 400);
const sendActionParamNotFound = (0, common_1.sendError)('Необходимо указать тип действия!', 400);
exports.getTVShows = (0, catchAsync_1.default)(async (req, res) => {
    const { search, sort, status, limit } = req.query;
    const searchQuery = {
        ...(search && { name: { $regex: search, $options: 'i' } }),
        ...(!['all'].includes(status) && { status }),
    };
    const tvShows = await tvShowModel_1.default.find(searchQuery)
        .sort(sort ? { 'flags.pinned': -1, [sort]: sort !== 'name' ? -1 : 1 } : { 'flags.pinned': -1, addedAt: -1 })
        .limit(+limit);
    const total = await tvShowModel_1.default.countDocuments(searchQuery);
    res.status(200).json({
        status: 'ok',
        data: { items: tvShows, total },
    });
});
exports.getTVShow = (0, catchAsync_1.default)(async (req, res, next) => {
    const { tvShowId } = req.params;
    if (!tvShowId)
        return next(sendParamNotFound);
    const tvShow = await tvShowModel_1.default.findById(tvShowId);
    if (!tvShow)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        data: tvShow,
    });
});
exports.getTVShowByUrl = (0, catchAsync_1.default)(async (req, res, next) => {
    const { tvShowUrl } = req.query;
    if (!tvShowUrl)
        return next(sendUrlParamNotFound);
    const tvShow = await tvShowModel_1.default.findOne({ url: tvShowUrl });
    if (!tvShow)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        data: tvShow,
    });
});
exports.createTVShow = (0, catchAsync_1.default)(async (req, res) => {
    const tvShow = await tvShowModel_1.default.create(req.body);
    res.status(201).json({
        status: 'ok',
        data: tvShow,
    });
});
exports.updateTVShow = (0, catchAsync_1.default)(async (req, res, next) => {
    const { tvShowId } = req.params;
    if (!tvShowId)
        return next(sendParamNotFound);
    const tvShow = await tvShowModel_1.default.findByIdAndUpdate(tvShowId, { ...req.body }, { new: true });
    if (!tvShow)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        data: tvShow,
    });
});
exports.markTVShow = (0, catchAsync_1.default)(async (req, res, next) => {
    const { tvShowId, action } = req.query;
    if (!action)
        return next(sendActionParamNotFound);
    const tvShow = await tvShowModel_1.default.findById(tvShowId);
    if (!tvShow)
        return next(sendError404);
    await tvShowModel_1.default.findByIdAndUpdate(tvShowId, {
        $set: {
            ...(action === 'pin' && { 'flags.pinned': !tvShow.flags.pinned }),
        },
    });
});
exports.deleteTVShow = (0, catchAsync_1.default)(async (req, res, next) => {
    const { tvShowId } = req.params;
    if (!tvShowId)
        return next(sendParamNotFound);
    const tvShow = await tvShowModel_1.default.findByIdAndDelete(tvShowId);
    if (!tvShow)
        return next(sendError404);
    res.status(204).json({
        status: 'ok',
        message: 'Сериал успешно удалён!',
    });
});
