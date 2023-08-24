"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWordSet = exports.updateWordSet = exports.createWordSet = exports.getUserWordSet = exports.getUserWordSets = exports.getWordSet = exports.getWordSets = void 0;
const mongoose_1 = require("mongoose");
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const common_1 = require("../../../utils/common");
const wordModel_1 = __importDefault(require("../../../models/miniapps/LinguaUniverse/wordModel"));
const wordSetModel_1 = __importDefault(require("../../../models/miniapps/LinguaUniverse/wordSetModel"));
// possible errors
const sendError404 = (0, common_1.sendError)('Такой группы слов не найдено!', 404);
exports.getWordSets = (0, catchAsync_1.default)(async (req, res) => {
    const wordSets = await wordSetModel_1.default.find();
    res.status(200).json({
        status: 'ok',
        data: wordSets,
    });
});
exports.getWordSet = (0, catchAsync_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const wordSet = await wordSetModel_1.default.findById(id).populate('words');
    if (!wordSet)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        data: wordSet,
    });
});
exports.getUserWordSets = (0, catchAsync_1.default)(async (req, res) => {
    const { limit, as } = req.query;
    const { _id: userId } = req.user;
    const body = { users: { $in: userId } };
    const wordSets = await wordSetModel_1.default.find(body).sort({ createdAt: -1 }).limit(+limit || 0).select(as === 'list' ? { _id: 1, name: 1 } : {});
    const total = await wordSetModel_1.default.countDocuments(body);
    res.status(200).json({
        status: 'ok',
        data: { items: wordSets, total },
    });
});
exports.getUserWordSet = (0, catchAsync_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const { _id: userId } = req.user;
    const wordSet = await wordSetModel_1.default.findById(id);
    if (!wordSet)
        return next(sendError404);
    const query = { _id: { $in: wordSet.words } };
    const words = await wordModel_1.default.find(query).sort({ addedAt: -1 }).populate('wordSets', 'name');
    const total = await wordModel_1.default.countDocuments(query);
    const remaining = await wordModel_1.default.countDocuments({ ...query, learned_by: { $in: [userId] } });
    const percentage = (100 / total) * remaining;
    res.status(200).json({
        status: 'ok',
        data: { words, total, progress: { remaining, percentage } },
    });
});
exports.createWordSet = (0, catchAsync_1.default)(async (req, res) => {
    const { name, img } = req.body;
    const { _id: userId } = req.user;
    const newWordSet = await wordSetModel_1.default.create({
        name, users: [userId], owner: userId, img,
    });
    res.status(201).json({
        status: 'ok',
        data: newWordSet,
    });
});
exports.updateWordSet = (0, catchAsync_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const { action } = req.query;
    const words = req.body.words.map((word) => new mongoose_1.Types.ObjectId(word));
    if (action === 'addWords') {
        const wordSet = await wordSetModel_1.default.findByIdAndUpdate(id, {
            $addToSet: { words: { $each: words } },
        }, { new: true });
        if (!wordSet)
            return next(sendError404);
        await wordModel_1.default.updateMany({ _id: { $in: words } }, { $addToSet: { wordSets: id } });
        return res.status(200).json({
            status: 'ok',
            message: 'Слова успешно добавлены в набор',
            data: wordSet,
        });
    }
    if (action === 'removeWords') {
        const wordSet = await wordSetModel_1.default.findByIdAndUpdate(id, {
            $pullAll: { words },
        });
        if (!wordSet)
            return next(sendError404);
        await wordModel_1.default.updateMany({ _id: { $in: words } }, { $pull: { wordSets: id } }, { new: true });
        return res.status(200).json({
            status: 'ok',
            message: 'Слова успешно убраны из набора',
            data: wordSet,
        });
    }
    const wordSet = await wordSetModel_1.default.findByIdAndUpdate(id, req.body, { new: true });
    if (!wordSet)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        data: wordSet,
    });
});
exports.deleteWordSet = (0, catchAsync_1.default)(async (req, res, next) => {
    const wordSetId = new mongoose_1.Types.ObjectId(req.params.id);
    const wordSet = await wordSetModel_1.default.findByIdAndDelete(wordSetId);
    if (!wordSet)
        return next(sendError404);
    await wordModel_1.default.updateMany({ _id: { $in: wordSet.words } }, { $pull: { wordSets: wordSetId } });
    res.status(204).json({
        status: 'ok',
        message: 'Набор успешно удалён',
    });
});
