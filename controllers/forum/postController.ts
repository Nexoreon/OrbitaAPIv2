import mongoose from 'mongoose';
import { sendError } from '../../utils/common';
import catchAsync from '../../utils/catchAsync';

import Post from '../../models/forum/postModel';
import Topic from '../../models/forum/topicModel';

// possible errors
const sendError404 = sendError('Такого поста не найдено', 404);
const sendError404M = sendError('Не обнаружено постов с такими ID', 404);
const sendErrorWrongTopic = sendError('Эти посты уже находятся в этой теме', 400);

export const getAllPosts = catchAsync(async (req, res) => {
    const posts = await Post.find();
    const length = await Post.countDocuments();

    res.status(200).json({
        status: 'ok',
        length,
        data: posts,
    });
});

export const getPosts = catchAsync(async (req, res, next) => {
    const posts = await Post.find({ _id: { $in: req.body.ids } });
    if (!posts) return next(sendError404M);

    res.status(200).json({
        status: 'ok',
        data: posts,
    });
});

export const getPost = catchAsync(async (req, res, next) => {
    const post = await Post.findById(req.params.id);
    if (!post) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        data: post,
    });
});

export const createPost = catchAsync(async (req, res) => {
    const newPost = await Post.create({
        ...req.body,
        authorId: req.user!._id,
    });

    // update topic
    await Topic.findByIdAndUpdate(req.body.relatedTo, {
        $addToSet: { posts: newPost._id },
        $inc: { postsCounter: 1 },
        updatedAt: Date.now(),
        ...(req.body.main && { mainPost: newPost._id }), // FIXME Уязвимость уровня API: Отсыл нового поста с main может сделать этот пост главным для темы
    });

    res.status(201).json({
        status: 'ok',
        data: newPost,
    });
});

export const updatePost = catchAsync(async (req, res, next) => {
    req.body = {
        ...req.body,
        updatedAt: Date.now(),
    };

    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post) return next(sendError404);

    if (req.body.flags && req.body.flags.important || req.body.flags && !req.body.flags.important) {
        const importantStatus = req.body.flags.important;
        // update topic
        await Topic.findByIdAndUpdate(post.relatedTo, {
            ...(importantStatus && { importantPost: post._id }),
            ...(!importantStatus && { $unset: { importantPost: 1 } }),
        });
    }

    res.status(200).json({
        status: 'ok',
        data: post,
    });
});

export const deletePost = catchAsync(async (req, res, next) => {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return next(sendError404);

    // update topic
    await Topic.findByIdAndUpdate(post.relatedTo, {
        $pull: { posts: post._id },
        $inc: { postsCounter: -1 },
    });

    res.status(204).json({
        status: 'ok',
        message: 'Пост успешно был удлаён!',
    });
});

export const deletePosts = catchAsync(async (req, res) => {
    await Post.deleteMany({ _id: { $in: req.body.ids } });
    const objectIDs = req.body.ids.map((id: string) => new mongoose.Types.ObjectId(id));
    // update topic
    await Topic.findByIdAndUpdate(req.body.topicId, {
        $pull: { posts: { $in: objectIDs } },
        $inc: { postsCounter: -objectIDs.length },
    }, { new: true });

    res.status(204).json({
        status: 'ok',
        message: 'Успешно удалено',
    });
});

export const deleteAllPosts = catchAsync(async (req, res) => {
    await Post.deleteMany({ relatedTo: { $in: req.body.topicsIDs } });

    res.status(204).json({
        status: 'ok',
        message: 'Данные успешно удалены',
    });
});

export const movePosts = catchAsync(async (req, res, next) => {
    const { posts, topicId, newTopicId } = req.body;
    if (topicId === newTopicId) return next(sendErrorWrongTopic);

    const postsObjectIDs = posts.map((id: string) => new mongoose.Types.ObjectId(id));
    const oldTopic = await Topic.findByIdAndUpdate(topicId, {
        $pull: { posts: { $in: postsObjectIDs } },
        $inc: { postsCounter: -posts.length },
    });

    posts.map(async (post: mongoose.Types.ObjectId) => {
        await Post.findByIdAndUpdate(post, {
            relatedTo: newTopicId,
        });
    });

    if (oldTopic!.importantPost && posts.includes(oldTopic!.importantPost.toString())) {
        await Post.findByIdAndUpdate(oldTopic?.importantPost, {
            flags: { important: false },
        });
        oldTopic!.importantPost = undefined;
        await oldTopic!.save();
    }

    await Topic.findByIdAndUpdate(newTopicId, {
        $addToSet: { posts: { $each: postsObjectIDs } },
        $inc: { postsCounter: posts.length },
    });
});
