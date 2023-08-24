import { Types } from 'mongoose';
import catchAsync from '../../../utils/catchAsync';
import { sendError } from '../../../utils/common';

import Word from '../../../models/miniapps/LinguaUniverse/wordModel';

// possible errors
const sendErrorWordId = sendError('Параметр wordId требует указания ID слова для которого подбираются варианты ответа', 400);

export const getUserUnlearnedWords = catchAsync(async (req, res) => {
    const { wordSet, onlyStatus } = req.query;
    const { _id: userId } = req.user!;

    const pipeline = [
        {
            $match: { ...(wordSet && { wordSets: { $in: [new Types.ObjectId(wordSet as string)] } }), users: { $in: [userId] }, learned_by: { $ne: userId } },
        },
        {
            $sample: { size: 10 },
        },
    ];

    const words = await Word.aggregate(pipeline);
    let data: Promise<object[]> | object = words;

    if (onlyStatus) data = { isWordPuzzleAvailable: words.length >= 1, isTranslateWordAvailable: words.length >= 10 };
    res.status(200).json({
        status: 'ok',
        data,
    });
});

export const getPossibleAnswers = catchAsync(async (req, res, next) => {
    if (!req.query.wordId) return next(sendErrorWordId);
    const { _id: userId } = req.user!;
    const wordId = new Types.ObjectId(req.query.wordId as string);
    let wordSet;
    if (req.query.wordSet) wordSet = new Types.ObjectId(req.query.wordSet as string);

    const pipeline = [
        {
            $match: { ...(!req.query.wordSet && { users: { $in: [userId] } }), ...(req.query.wordSet && { wordSets: { $in: [wordSet] } }), _id: { $ne: wordId } },
        },
        {
            $sample: { size: 5 },
        },
    ];

    const rightAnswer = await Word.findById(wordId);
    const otherAnswers = await Word.aggregate(pipeline);
    let data: object[] = [rightAnswer, ...otherAnswers];
    data = data.sort(() => 0.5 - Math.random());

    res.status(200).json({
        status: 'ok',
        data,
    });
});

export const getUserDictionary = catchAsync(async (req, res) => {
    const { query, limit } = req.query;
    const { _id: userId } = req.user!;
    const queryVal = new RegExp(query as string, 'i');

    const total = await Word.countDocuments({ users: { $in: [userId] }, word: queryVal });
    const remaining = await Word.countDocuments({ users: { $in: [userId] }, learned_by: { $in: [userId] } });
    const percentage = (100 / total) * remaining;
    const words = await Word.aggregate([
        { $match: { users: { $in: [userId] } } },
        { $match: { word: queryVal } },
        { $sort: { addedAt: -1, _id: -1 } },
        { $limit: +limit! || 100 },
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
