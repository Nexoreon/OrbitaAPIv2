"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWords = exports.deleteWord = exports.resetStatus = exports.markAsLearned = exports.updateWord = exports.getWord = exports.getWords = exports.addWord = void 0;
const mongoose_1 = require("mongoose");
const common_1 = require("../../../utils/common");
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const wordModel_1 = __importDefault(require("../../../models/miniapps/LinguaUniverse/wordModel"));
const wordSetModel_1 = __importDefault(require("../../../models/miniapps/LinguaUniverse/wordSetModel"));
// possible errors
const sendError404 = (0, common_1.sendError)('Такого слова не существует', 404);
exports.addWord = (0, catchAsync_1.default)(async (req, res) => {
    const { word, translation } = req.body;
    const { _id: userId } = req.user;
    const wordExists = await wordModel_1.default.findOne({ word });
    if (wordExists) {
        await wordModel_1.default.findByIdAndUpdate(wordExists._id, {
            $addToSet: { users: userId, translation },
        });
        return res.status(200).json({
            status: 'ok',
            message: 'Слово существует и было добавлено в словарь пользователя',
        });
    }
    const newWord = await wordModel_1.default.create({
        ...req.body,
        users: [userId],
    });
    res.status(201).json({
        status: 'ok',
        data: newWord,
    });
});
exports.getWords = (0, catchAsync_1.default)(async (req, res) => {
    const words = await wordModel_1.default.find();
    res.status(200).json({
        status: 'ok',
        data: words,
    });
});
exports.getWord = (0, catchAsync_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const word = await wordModel_1.default.findById(id);
    if (!word)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        data: word,
    });
});
exports.updateWord = (0, catchAsync_1.default)(async (req, res, next) => {
    const { id } = req.params;
    const word = await wordModel_1.default.findByIdAndUpdate(id, req.body);
    if (!word)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        data: word,
    });
});
// App
exports.markAsLearned = (0, catchAsync_1.default)(async (req, res) => {
    const { words, from } = req.body;
    const { _id: userId } = req.user;
    await wordModel_1.default.updateMany({ _id: { $in: words } }, { $addToSet: { learned_by: userId } });
    if (from === 'training') {
        const achievementIds = ['63a965494490e5a8721cbe08', '63a965844490e5a8721cbe1a', '63a965d84490e5a8721cbe2f'];
        achievementIds.map((achievementId) => { (0, common_1.updateAchievementProgress)(userId, achievementId, words.length); });
    }
    res.status(200).json({
        status: 'ok',
    });
});
exports.resetStatus = (0, catchAsync_1.default)(async (req, res) => {
    const { words } = req.body;
    const { _id: userId } = req.user;
    await wordModel_1.default.updateMany({ _id: { $in: words } }, { $pull: { learned_by: userId } });
    res.status(200).json({
        status: 'ok',
        message: 'Статус изучения указанных слов успешно сброшен',
    });
});
exports.deleteWord = (0, catchAsync_1.default)(async (req, res, next) => {
    const wordId = new mongoose_1.Types.ObjectId(req.params.id);
    const word = await wordModel_1.default.findByIdAndDelete(wordId);
    if (!word)
        return next(sendError404);
    await wordSetModel_1.default.updateMany({ words: { $in: wordId } }, { $pull: { words: wordId } });
    res.status(204).json({
        status: 'ok',
        message: 'Слово успешно удалено',
    });
});
exports.deleteWords = (0, catchAsync_1.default)(async (req, res) => {
    let { words } = req.body;
    words = words.map((word) => new mongoose_1.Types.ObjectId(word));
    await wordSetModel_1.default.updateMany({}, {
        $pullAll: { words },
    });
    await wordModel_1.default.deleteMany({ _id: { $in: words } });
    res.status(204).json({
        status: 'ok',
        message: 'Указанные слова были успешно удалены',
    });
});
