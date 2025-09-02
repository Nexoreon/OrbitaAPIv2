/* eslint-disable prefer-destructuring */
import catchAsync from '../../utils/catchAsync';
import Category from '../../models/forum/categoryModel';
import Topic, { ITopic } from '../../models/forum/topicModel';
import Post, { IPost } from '../../models/forum/postModel';

// allowed sections ['Общее', 'Разделы проекта', 'Оборудование', 'Обучение', 'Другое'];
export const getForumData = catchAsync(async (req, res) => {
    const categories = await Category.aggregate([
        {
            $match: { parentId: { $exists: false } },
        },
        {
            $lookup: {
                from: 'forum_categories',
                let: { id: '$_id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$parentId', '$$id'] }, 'flags.isLink': false } },
                    { $project: { name: 1, url: 1 } },
                ],
                as: 'subCategories',
            },
        },
        {
            $lookup: {
                from: 'forum_topics',
                let: { id: '$_id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$parentId', '$$id'] } } },
                    { $sort: { updatedAt: -1 } },
                    { $limit: 1 },
                    { $project: { name: 1, url: 1 } },
                ],
                as: 'temp.updatedTopic',
            },
        },
        {
            $set: {
                'updatedTopic.topic': { $mergeObjects: '$temp.updatedTopic' },
            },
        },
        {
            $lookup: {
                from: 'forum_posts',
                let: { id: '$updatedTopic.topic._id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$relatedTo', '$$id'] } } },
                    { $sort: { createdAt: -1 } },
                    { $limit: 1 },
                    { $project: { createdAt: 1, authorId: 1 } },
                ],
                as: 'temp.post',
            },
        },
        {
            $set: {
                'updatedTopic.post': { $mergeObjects: '$temp.post' },
            },
        },
        {
            $lookup: {
                from: 'users',
                let: { id: '$updatedTopic.post.authorId' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$id'] } } },
                    { $project: { name: 1, photo: 1 } },
                ],
                as: 'temp.author',
            },
        },
        {
            $set: {
                'updatedTopic.author': { $mergeObjects: '$temp.author' },
            },
        },
        {
            $unset: ['temp'],
        },
        {
            $group: {
                _id: '$section',
                items: { $push: '$$CURRENT' },
            },
        },
        {
            $project: {
                _id: 0,
                section: '$_id',
                items: 1,
            },
        },
        {
            $sort: { 'items.createdAt': 1 },
        },
    ]);

    res.status(200).json({
        status: 'ok',
        data: { categories },
    });
});

export const getCategoryData = catchAsync(async (req, res) => {
    const { limit, page } = req.query;
    const category = await Category.findOne({ url: req.params.categoryUrl });
    if (!category) {
        return res.status(404).json({
            status: 'fail',
            message: 'Эта категория не существует',
            data: { categoryNotExists: true },
        });
    }

    const categoryTopics = await Topic.find({ parentId: category._id });
    const categoryTopicsPinned = await Topic.find({ parentId: category.id, 'flags.pinned': true });
    const topicsLength = categoryTopics.length;
    const lengthWithoutPinned = categoryTopics.length - categoryTopicsPinned.length;

    const subCategories = await Category.aggregate([
        {
            $match: { parentId: category._id },
        },
        {
            $lookup: {
                from: 'forum_categories',
                let: { id: '$_id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$parentId', '$$id'] } } },
                    { $project: { name: 1, url: 1 } },
                ],
                as: 'subCategories',
            },
        },
        {
            $lookup: {
                from: 'forum_topics',
                let: { id: '$_id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$parentId', '$$id'] } } },
                    { $sort: { updatedAt: -1 } },
                    { $limit: 1 },
                    { $project: { name: 1, url: 1 } },
                ],
                as: 'temp.updatedTopic',
            },
        },
        {
            $set: {
                'updatedTopic.topic': { $mergeObjects: '$temp.updatedTopic' },
            },
        },
        {
            $lookup: {
                from: 'forum_posts',
                let: { id: '$updatedTopic.topic._id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$relatedTo', '$$id'] } } },
                    { $sort: { createdAt: -1 } },
                    { $limit: 1 },
                    { $project: { createdAt: 1, authorId: 1 } },
                ],
                as: 'temp.post',
            },
        },
        {
            $set: {
                'updatedTopic.post': { $mergeObjects: '$temp.post' },
            },
        },
        {
            $lookup: {
                from: 'users',
                let: { id: '$updatedTopic.post.authorId' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$id'] } } },
                    { $project: { name: 1, photo: 1 } },
                ],
                as: 'temp.author',
            },
        },
        {
            $set: {
                'updatedTopic.author': { $mergeObjects: '$temp.author' },
            },
        },
        {
            $unset: ['temp'],
        },
    ]);

    const sort = req.query.sort as string;
    const topics = await Topic.aggregate([
        {
            $match: { parentId: category._id, 'flags.pinned': false },
        },
        {
            $sort: sort ? { [sort.split('-')[1]]: -1 } : { createdAt: -1 },
        },
        {
            $skip: page ? (+page * 1 - 1) * 15 : 0,
        },
        {
            $limit: limit && +limit || 15,
        },
        {
            $lookup: {
                from: 'users',
                let: { id: '$authorId' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$id'] } } },
                    { $project: { name: 1 } },
                ],
                as: 'author',
            },
        },
        {
            $set: { author: { $mergeObjects: '$author' } },
        },
        {
            $lookup: {
                from: 'forum_posts',
                let: { id: '$_id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$relatedTo', '$$id'] } } },
                    { $sort: { createdAt: -1 } },
                    { $limit: 1 },
                    { $project: { authorId: 1, createdAt: 1, url: 1 } },
                ],
                as: 'temp.latestPost',
            },
        },
        {
            $set: { 'latestPost.post': { $mergeObjects: { $last: '$temp.latestPost' } } },
        },
        {
            $lookup: {
                from: 'users',
                let: { id: '$latestPost.post.authorId' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$id'] } } },
                    { $project: { name: 1, photo: 1 } },
                ],
                as: 'temp.author',
            },
        },
        {
            $set: { 'latestPost.author': { $mergeObjects: '$temp.author' } },
        },
        {
            $unset: ['temp'],
        },
    ]);

    let pinnedTopics: object | undefined;
    if (page && +page !== 1) {
        const totalPages = !Number.isInteger(lengthWithoutPinned / +limit!) ? Math.floor(lengthWithoutPinned / +limit!) + 1 : lengthWithoutPinned / +limit!;
        const isPageExists = totalPages < +page;
        if (isPageExists || +page === 0 || Number.isNaN(+page)) {
            return res.status(404).json({
                status: 'fail',
                data: { isPageExists: false, pageToRedirect: totalPages === 0 ? 1 : totalPages },
            });
        }
    } else {
        pinnedTopics = await Topic.aggregate([
            {
                $match: { parentId: category._id, 'flags.pinned': true },
            },
            {
                $sort: sort ? { [sort.split('-')[1]]: -1 } : { createdAt: -1 },
            },
            {
                $lookup: {
                    from: 'users',
                    let: { id: '$authorId' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$id'] } } },
                        { $project: { name: 1 } },
                    ],
                    as: 'author',
                },
            },
            {
                $set: { author: { $mergeObjects: '$author' } },
            },
            {
                $lookup: {
                    from: 'forum_posts',
                    let: { id: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$relatedTo', '$$id'] } } },
                        { $sort: { createdAt: -1 } },
                        { $limit: 1 },
                        { $project: { authorId: 1, createdAt: 1, url: 1 } },
                    ],
                    as: 'temp.latestPost',
                },
            },
            {
                $set: { 'latestPost.post': { $mergeObjects: { $last: '$temp.latestPost' } } },
            },
            {
                $lookup: {
                    from: 'users',
                    let: { id: '$latestPost.post.authorId' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$id'] } } },
                        { $project: { name: 1, photo: 1 } },
                    ],
                    as: 'temp.author',
                },
            },
            {
                $set: { 'latestPost.author': { $mergeObjects: '$temp.author' } },
            },
            {
                $unset: ['temp'],
            },
        ]);
    }

    res.status(200).json({
        status: 'ok',
        data: {
            category,
            subCategories,
            topics,
            pinnedTopics,
            topicsLength,
            lengthWithoutPinned,
        },
    });
});

export const getTopicData = catchAsync(async (req, res) => {
    const { limit, page, offset } = req.query;
    let topic: ITopic[] | ITopic = await Topic.aggregate([
        {
            $match: { url: req.params.topicUrl },
        },
        {
            $lookup: {
                from: 'users',
                let: { id: '$authorId' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$id'] } } },
                    { $project: { name: 1, photo: 1 } },
                ],
                as: 'author',
            },
        },
        {
            $set: { author: { $mergeObjects: '$author' } },
        },
    ]);

    if (!topic.length) {
        return res.status(404).json({
            status: 'fail',
            message: 'Такой темы не существует',
            data: { topicNotExists: true },
        });
    }
    topic = topic[0]!;

    // inc views counter
    await Topic.findOneAndUpdate({ url: req.params.topicUrl }, {
        $inc: { views: 1 },
    });

    let mainPost: IPost[] | IPost = await Post.aggregate([
        {
            $match: { _id: topic.mainPost },
        },
        {
            $lookup: {
                from: 'users',
                let: { id: '$authorId' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$id'] } } },
                    { $project: { name: 1, photo: 1, role: 1 } },
                ],
                as: 'author',
            },
        },
        {
            $set: { author: { $mergeObjects: '$author' } },
        },
    ]);
    mainPost = mainPost[0];

    const postsLength = topic.posts.length - +offset!;
    const posts = await Post.aggregate([
        {
            $match: { relatedTo: topic._id },
        },
        {
            $sort: { createdAt: 1 },
        },
        {
            $skip: page ? (+page! - 1) * 7 + 1 : 1,
        },
        {
            $limit: +limit! || 7,
        },
        {
            $lookup: {
                from: 'users',
                let: { id: '$authorId' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$id'] } } },
                    { $project: { name: 1, email: 1, photo: 1, role: 1 } },
                ],
                as: 'author',
            },
        },
        {
            $set: { author: { $mergeObjects: '$author' } },
        },
    ]);

    if (page && +page !== 1) {
        const totalPages = !Number.isInteger(postsLength / +limit!) ? Math.floor(postsLength / +limit!) + 1 : postsLength / +limit!;
        const isPageExists = totalPages < +page;

        if (isPageExists || +page === 0 || Number.isNaN(+page)) {
            return res.status(404).json({
                status: 'fail',
                message: 'Такая страница не существует. Возврат к последней странице',
                data: { isPageExists: false, pageToRedirect: totalPages === 0 ? 1 : totalPages },
            });
        }
    }

    let importantPost: IPost[] | IPost | undefined;
    if (topic.importantPost) {
        importantPost = await Post.aggregate([
            {
                $match: { _id: topic.importantPost },
            },
            {
                $lookup: {
                    from: 'users',
                    let: { id: '$authorId' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$id'] } } },
                        { $project: { name: 1, photo: 1 } },
                    ],
                    as: 'author',
                },
            },
            {
                $set: { author: { $mergeObjects: '$author' } },
            },
        ]);
        importantPost = importantPost[0];

        if (importantPost === null) {
            await Topic.findOneAndUpdate({ url: req.params.topicUrl }, {
                importantPost: undefined,
            });
        }
    }

    res.status(200).json({
        status: 'ok',
        data: {
            topic,
            mainPost,
            posts,
            postsLength,
            importantPost,
        },
    });
});
