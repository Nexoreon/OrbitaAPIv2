import { Types } from 'mongoose';
import catchAsync from '../../../utils/catchAsync';
import { sendError } from '../../../utils/common';
import Word from '../../../models/miniapps/LinguaUniverse/wordModel';
import WordSet from '../../../models/miniapps/LinguaUniverse/wordSetModel';

// possible errors
const sendError404 = sendError('Такой группы слов не найдено!', 404);
export const getWordSets = catchAsync(async (req, res) => {
    const wordSets = await WordSet.find();

    res.status(200).json({
        status: 'ok',
        data: wordSets,
    });
});

export const getWordSet = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const wordSet = await WordSet.findById(id).populate('words');
    if (!wordSet) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        data: wordSet,
    });
});

export const getUserWordSets = catchAsync(async (req, res) => {
    const { limit, as } = req.query;
    const { _id: userId } = req.user!;
    const body = { users: { $in: userId } };
    const wordSets = await WordSet.find(body).sort({ createdAt: -1 }).limit(+limit! || 0).select(as === 'list' ? { _id: 1, name: 1 } : {});
    const total = await WordSet.countDocuments(body);

    res.status(200).json({
        status: 'ok',
        data: { items: wordSets, total },
    });
});

export const getUserWordSet = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { limit } = req.query;
    const { _id: userId } = req.user!;
    const wordSet = await WordSet.findById(id);
    if (!wordSet) return next(sendError404);

    const query = { _id: { $in: wordSet.words } };
    const words = await Word.find(query).sort({ addedAt: -1 }).limit(+limit!).populate('wordSets', 'name');
    const total = await Word.countDocuments(query);
    const remaining = await Word.countDocuments({ ...query, learned_by: { $in: [userId] } });
    const percentage = (100 / total) * remaining;

    res.status(200).json({
        status: 'ok',
        data: { words, total, progress: { remaining, percentage } },
    });
});

export const createWordSet = catchAsync(async (req, res) => {
    const { name, img } = req.body;
    const { _id: userId } = req.user!;
    const newWordSet = await WordSet.create({
        name, users: [userId], owner: userId, img,
    });

    res.status(201).json({
        status: 'ok',
        data: newWordSet,
    });
});

export const updateWordSet = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { action } = req.query;
    const words = req.body.words.map((word: string) => new Types.ObjectId(word));
    if (action === 'addWords') {
        const wordSet = await WordSet.findByIdAndUpdate(id, {
            $addToSet: { words: { $each: words } },
        }, { new: true });
        if (!wordSet) return next(sendError404);
        await Word.updateMany({ _id: { $in: words } }, { $addToSet: { wordSets: id } });

        return res.status(200).json({
            status: 'ok',
            message: 'Слова успешно добавлены в набор',
            data: wordSet,
        });
    }

    if (action === 'removeWords') {
        const wordSet = await WordSet.findByIdAndUpdate(id, {
            $pullAll: { words },
        });
        if (!wordSet) return next(sendError404);
        await Word.updateMany({ _id: { $in: words } }, { $pull: { wordSets: id } }, { new: true });

        return res.status(200).json({
            status: 'ok',
            message: 'Слова успешно убраны из набора',
            data: wordSet,
        });
    }

    const wordSet = await WordSet.findByIdAndUpdate(id, req.body, { new: true });
    if (!wordSet) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        data: wordSet,
    });
});

export const deleteWordSet = catchAsync(async (req, res, next) => {
    const wordSetId = new Types.ObjectId(req.params.id);
    const wordSet = await WordSet.findByIdAndDelete(wordSetId);
    if (!wordSet) return next(sendError404);

    await Word.updateMany({ _id: { $in: wordSet.words } }, { $pull: { wordSets: wordSetId } });

    res.status(204).json({
        status: 'ok',
        message: 'Набор успешно удалён',
    });
});
