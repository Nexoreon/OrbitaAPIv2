import { Types } from 'mongoose';
import { sendError } from '../../utils/common';
import catchAsync from '../../utils/catchAsync';
import Topic from '../../models/forum/topicModel';
import Post from '../../models/forum/postModel';
import Category from '../../models/forum/categoryModel';

// possible errors
const sendError404 = sendError('Такая тема не найдена', 404);
const sendError404M = sendError('Такие темы не найдены', 404);
const sendErrorParentParam = sendError('Необходимо указать для какой категории или подкатегории создаётся эта тема', 400);
const sendErrorIdsEmpty = sendError('Необходимо указать ID тем для их обновления', 400);
const sendErrorNoMoveParams = sendError('Передано недостаточно аргументов. Убедитесь что вы указали ID тем, категорию родителя и категорию в которую переносятся посты', 400);
const sendErrorNoDeleteParams = sendError('Для удаления нескольких тем необходимо указать ID удаляемых тем и ID категории родителя', 400);

export const getAllTopics = catchAsync(async (req, res) => {
    const topics = await Topic.find();
    const length = await Topic.countDocuments();

    res.status(200).json({
        status: 'success',
        length,
        data: topics,
    });
});

export const getTopics = catchAsync(async (req, res, next) => {
    const { categoryId } = req.query;
    const topics = await Topic.find({ parentId: categoryId });
    if (!topics) return next(sendError404M);

    res.status(200).json({
        status: 'success',
        data: topics,
    });
});

export const getTopic = catchAsync(async (req, res, next) => {
    const topic = await Topic.findById(req.params.id);
    if (!topic) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        data: topic,
    });
});

export const createTopic = catchAsync(async (req, res, next) => {
    const { parentId } = req.query;
    if (!parentId) return next(sendErrorParentParam);

    const newTopic = await Topic.create({
        ...req.body,
        authorId: req.user!._id,
        parentId,
    });

    // add id to parent
    await Category.findByIdAndUpdate(parentId, {
        $addToSet: { topics: newTopic._id },
    });

    req.body = {
        ...req.body,
        relatedTo: newTopic._id,
        main: true,
        flags: {},
    };
    next();
});

export const updateTopic = catchAsync(async (req, res, next) => {
    const topic = await Topic.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });
    if (!topic) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        data: topic,
    });
});

export const updateTopics = catchAsync(async (req, res, next) => {
    const { topicsIDs } = req.body;
    if (!topicsIDs.length) return next(sendErrorIdsEmpty);
    const convertedIDs = topicsIDs.map((id: string) => new Types.ObjectId(id));
    if (req.body.flags) {
        await Topic.updateMany({ _id: { $in: convertedIDs } }, {
            ...(req.body.flags.important && { 'flags.important': req.body.flags.important }),
            ...(req.body.flags.locked && { 'flags.locked': req.body.flags.locked }),
            ...(req.body.flags.pinned && { 'flags.pinned': req.body.flags.pinned }),
            ...(req.body.flags.important === false && { 'flags.important': req.body.flags.important }),
            ...(req.body.flags.locked === false && { 'flags.locked': req.body.flags.locked }),
            ...(req.body.flags.pinned === false && { 'flags.pinned': req.body.flags.pinned }),
        });
    }

    res.status(200).json({
        status: 'ok',
        message: 'Темы успешно обновлены',
    });
});

export const moveTopic = catchAsync(async (req, res, next) => {
    const { topicId, moveTo } = req.body;
    const topic = await Topic.findByIdAndUpdate(topicId, {
        parentId: moveTo,
    });
    if (!topic) return next(sendError404);

    // remove from old category
    await Category.findByIdAndUpdate(topic.parentId, {
        $pull: { topics: new Types.ObjectId(topicId) },
    });

    // add to new category
    await Category.findByIdAndUpdate(moveTo, {
        $addToSet: { topics: new Types.ObjectId(topicId) },
    });

    res.status(200).json({
        status: 'ok',
        message: 'Успешно перенесено',
    });
});

export const moveTopics = catchAsync(async (req, res, next) => {
    const { topicsIDs, categoryId, moveTo } = req.body;
    const convertedIDs = topicsIDs.map((id: string) => new Types.ObjectId(id));
    if (!moveTo || !topicsIDs) return next(sendErrorNoMoveParams);

    // remove from old category
    await Category.findByIdAndUpdate(categoryId, {
        $pull: { topics: { $in: convertedIDs } },
    });

    // add to new category
    const newCategory = await Category.findByIdAndUpdate(moveTo, {
        $addToSet: { topics: { $each: convertedIDs } },
    }, { new: true });

    convertedIDs.map(async (topic: Types.ObjectId) => {
        await Topic.findByIdAndUpdate(topic, {
            parentId: moveTo,
        });
    });

    res.status(200).json({
        status: 'ok',
        data: newCategory,
    });
});

export const deleteTopic = catchAsync(async (req, res, next) => {
    const topic = await Topic.findByIdAndDelete(req.params.id);
    if (!topic) return next(sendError404);

    // update category
    await Category.findByIdAndUpdate(topic.parentId, {
        $pull: { topics: new Types.ObjectId(req.params.id) },
    });

    // delete posts
    await Post.deleteMany({ _id: { $in: topic.posts } });

    res.status(204).json({
        status: 'ok',
        message: 'Тема успешно удалена',
    });
});

export const deleteTopics = catchAsync(async (req, res, next) => {
    const { topicsIDs, categoryId } = req.body;
    const convertedIDs = topicsIDs.map((id: string) => new Types.ObjectId(id));
    if (!topicsIDs || categoryId) return next(sendErrorNoDeleteParams);

    await Topic.deleteMany({ _id: { $in: convertedIDs } });
    await Post.deleteMany({ relatedTo: { $in: convertedIDs } });
    await Category.findByIdAndUpdate(categoryId, {
        $pull: { topics: { $in: convertedIDs } },
    });

    res.status(204).json({
        status: 'ok',
        message: 'Темы успешно удалены',
    });
});

export const deleteAllTopics = catchAsync(async (req, res, next) => {
    const topicsIDs = await Topic.find({ parentId: req.body.categoryId });
    req.body.topicsIDs = topicsIDs.map((topic) => topic._id);

    // delete topics
    await Topic.deleteMany({ parentId: req.body.categoryId });
    next();
});
