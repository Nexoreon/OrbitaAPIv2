"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserDictionary = exports.getPossibleAnswers = exports.getUserUnlearnedWords = void 0;
const mongoose_1 = require("mongoose");
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const common_1 = require("../../../utils/common");
const wordModel_1 = __importDefault(require("../../../models/miniapps/LinguaUniverse/wordModel"));
// possible errors
const sendErrorWordId = (0, common_1.sendError)('Параметр wordId требует указания ID слова для которого подбираются варианты ответа', 400);
exports.getUserUnlearnedWords = (0, catchAsync_1.default)(async (req, res) => {
    const { wordSet, onlyStatus } = req.query;
    const { _id: userId } = req.user;
    const pipeline = [
        {
            $match: { ...(wordSet && { wordSets: { $in: [new mongoose_1.Types.ObjectId(wordSet)] } }), users: { $in: [userId] }, learned_by: { $ne: userId } },
        },
        {
            $sample: { size: 10 },
        },
    ];
    const words = await wordModel_1.default.aggregate(pipeline);
    let data = words;
    if (onlyStatus)
        data = { isWordPuzzleAvailable: words.length >= 1, isTranslateWordAvailable: words.length >= 10 };
    res.status(200).json({
        status: 'ok',
        data,
    });
});
exports.getPossibleAnswers = (0, catchAsync_1.default)(async (req, res, next) => {
    if (!req.query.wordId)
        return next(sendErrorWordId);
    const { _id: userId } = req.user;
    const wordId = new mongoose_1.Types.ObjectId(req.query.wordId);
    let wordSet;
    if (req.query.wordSet)
        wordSet = new mongoose_1.Types.ObjectId(req.query.wordSet);
    const pipeline = [
        {
            $match: { ...(!req.query.wordSet && { users: { $in: [userId] } }), ...(req.query.wordSet && { wordSets: { $in: [wordSet] } }), _id: { $ne: wordId } },
        },
        {
            $sample: { size: 5 },
        },
    ];
    const rightAnswer = await wordModel_1.default.findById(wordId);
    const otherAnswers = await wordModel_1.default.aggregate(pipeline);
    let data = [rightAnswer, ...otherAnswers];
    data = data.sort(() => 0.5 - Math.random());
    res.status(200).json({
        status: 'ok',
        data,
    });
});
exports.getUserDictionary = (0, catchAsync_1.default)(async (req, res) => {
    const { query, limit } = req.query;
    const { _id: userId } = req.user;
    const queryVal = new RegExp(query, 'i');
    const total = await wordModel_1.default.countDocuments({ users: { $in: [userId] }, word: queryVal });
    const remaining = await wordModel_1.default.countDocuments({ users: { $in: [userId] }, learned_by: { $in: [userId] } });
    const percentage = (100 / total) * remaining;
    const words = await wordModel_1.default.aggregate([
        { $match: { users: { $in: [userId] } } },
        { $match: { word: queryVal } },
        { $sort: { addedAt: -1, _id: -1 } },
        { $limit: +limit || 100 },
        { $lookup: {
                from: 'linguauniverse_wordsets',
                localField: 'wordSets',
                foreignField: '_id',
                as: 'wordSets',
            } },
    ]);
    res.status(200).json({
        status: 'ok',
        data: { words, total, progress: { remaining, percentage } },
    });
});
