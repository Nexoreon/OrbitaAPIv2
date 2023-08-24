import { Types } from 'mongoose';
import { sendError, updateAchievementProgress } from '../../../utils/common';
import catchAsync from '../../../utils/catchAsync';
import Word from '../../../models/miniapps/LinguaUniverse/wordModel';
import WordSet from '../../../models/miniapps/LinguaUniverse/wordSetModel';

// possible errors
const sendError404 = sendError('Такого слова не существует', 404);

export const addWord = catchAsync(async (req, res) => {
    const { word, translation } = req.body;
    const { _id: userId } = req.user!;

    const wordExists = await Word.findOne({ word });
    if (wordExists) {
        await Word.findByIdAndUpdate(wordExists._id, {
            $addToSet: { users: userId, translation },
        });

        return res.status(200).json({
            status: 'ok',
            message: 'Слово существует и было добавлено в словарь пользователя',
        });
    }

    const newWord = await Word.create({
        ...req.body,
        users: [userId],
    });

    res.status(201).json({
        status: 'ok',
        data: newWord,
    });
});

export const getWords = catchAsync(async (req, res) => {
    const words = await Word.find();

    res.status(200).json({
        status: 'ok',
        data: words,
    });
});

export const getWord = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const word = await Word.findById(id);
    if (!word) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        data: word,
    });
});

export const updateWord = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const word = await Word.findByIdAndUpdate(id, req.body);
    if (!word) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        data: word,
    });
});

// App

export const markAsLearned = catchAsync(async (req, res) => {
    const { words, from } = req.body;
    const { _id: userId } = req.user!;
    await Word.updateMany({ _id: { $in: words } }, { $addToSet: { learned_by: userId } });

    if (from === 'training') {
        const achievementIds = ['63a965494490e5a8721cbe08', '63a965844490e5a8721cbe1a', '63a965d84490e5a8721cbe2f'];
        achievementIds.map((achievementId: string) => { updateAchievementProgress(userId, achievementId, words.length); });
    }

    res.status(200).json({
        status: 'ok',
    });
});

export const resetStatus = catchAsync(async (req, res) => {
    const { words } = req.body;
    const { _id: userId } = req.user!;
    await Word.updateMany({ _id: { $in: words } }, { $pull: { learned_by: userId } });

    res.status(200).json({
        status: 'ok',
        message: 'Статус изучения указанных слов успешно сброшен',
    });
});

export const deleteWord = catchAsync(async (req, res, next) => {
    const wordId = new Types.ObjectId(req.params.id);

    const word = await Word.findByIdAndDelete(wordId);
    if (!word) return next(sendError404);
    await WordSet.updateMany({ words: { $in: wordId } }, { $pull: { words: wordId } });

    res.status(204).json({
        status: 'ok',
        message: 'Слово успешно удалено',
    });
});

export const deleteWords = catchAsync(async (req, res) => {
    let { words } = req.body;
    words = words.map((word: string) => new Types.ObjectId(word));

    await WordSet.updateMany({}, {
        $pullAll: { words },
    });

    await Word.deleteMany({ _id: { $in: words } });

    res.status(204).json({
        status: 'ok',
        message: 'Указанные слова были успешно удалены',
    });
});
