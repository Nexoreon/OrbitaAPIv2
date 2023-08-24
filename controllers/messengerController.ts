import { Types } from 'mongoose';
import catchAsync from '../utils/catchAsync';
import { sendError } from '../utils/common';
import Conversation from '../models/messenger/conversationModel';
import Message from '../models/messenger/messageModel';

// possible errors
const sendError404 = sendError('Такого чата не существует или у вас нету доступа!', 404);
const sendError404Msg = sendError('Такого сообщения не существует!', 404);

export const getConversations = catchAsync(async (req, res) => {
    const { _id: userId } = req.user!;

    const commonPipeline = [
        { $unwind: { path: '$latestMessage', preserveNullAndEmptyArrays: true } },
        { $addFields: { unreadMessages: { $size: '$unreadMessages' } } },
        { $sort: { 'latestMessage.createdAt': -1 } },
    ];
    const convsMessages = await Conversation.aggregate([
        { $match: { users: userId, type: 'messages' } },
        { $lookup: {
            from: 'chat_messages',
            let: { id: '$_id' },
            pipeline: [
                { $match: { $expr: { $eq: ['$relatedTo', '$$id'] } } },
                { $project: { content: 1, createdAt: 1 } },
                { $sort: { createdAt: -1 } },
                { $limit: 1 },
            ],
            as: 'latestMessage',
        } },
        { $lookup: {
            from: 'chat_messages',
            let: { id: '$_id' },
            pipeline: [
                { $match: { $expr: { $eq: ['$relatedTo', '$$id'] }, readBy: { $ne: userId } } },
                { $project: { createdAt: 1 } },
            ],
            as: 'unreadMessages',
        } },
        ...commonPipeline as any,
    ]);
    const total = await Conversation.countDocuments({ users: userId });

    res.status(200).json({
        status: 'ok',
        data: {
            total,
            items: convsMessages,
        },
    });
});

export const getConversation = catchAsync(async (req, res, next) => {
    const { convId } = req.params;
    const { limit } = req.query;
    const { _id: userId } = req.user!;

    const conversation = await Conversation.findOne({ _id: convId, users: userId });
    if (!conversation) return next(sendError404);

    const messages = await Message.aggregate([
        { $match: { relatedTo: new Types.ObjectId(convId), isInformational: { $exists: false } } },
        { $sort: { createdAt: 1 } },
        { $addFields: { day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } } },
        { $group:
            {
                _id: { createdAt: '$day' },
                items: { $push: '$$CURRENT' },
            },
        },
        { $project: { date: '$_id.createdAt', items: 1, _id: 0 } },
        { $limit: +limit! },
        { $sort: { date: -1 } },
    ]);
    const total = await Message.countDocuments({ relatedTo: new Types.ObjectId(convId), isInformational: { $exists: false } });

    res.status(200).json({
        status: 'ok',
        data: {
            conversation,
            messages: {
                total,
                items: messages,
            },
        },
    });
});

export const createConversation = catchAsync(async (req, res) => {
    const { _id: userId } = req.user!;

    const newConversation = await Conversation.create({ ...req.body, users: userId });
    await Message.create({ relatedTo: newConversation._id, isInformational: true, content: 'Чат создан', readBy: [userId] });

    res.status(201).json({
        status: 'ok',
        data: newConversation,
    });
});

export const deleteConversation = catchAsync(async (req, res, next) => {
    const { convId } = req.params;
    const conversation = await Conversation.findById({ _id: convId });
    if (!conversation) return next(sendError404);

    await Conversation.findByIdAndDelete({ _id: convId });
    await Message.deleteMany({ relatedTo: convId });

    res.status(204).json({
        status: 'ok',
        message: 'Чат успешно удалён',
    });
});

export const sendMessage = catchAsync(async (req, res, next) => {
    const { _id: userId } = req.user!;
    const { convId } = req.params;

    const conv = await Conversation.findOne({ _id: convId, users: userId });
    if (!conv) return next(sendError404);

    const newMessage = await Message.create({ relatedTo: convId, user: userId, readBy: [userId], ...req.body });

    res.status(201).json({
        status: 'ok',
        data: newMessage,
    });
});

export const getMessage = catchAsync(async (req, res, next) => {
    const { msgId } = req.params;

    const msg = await Message.findById({ _id: msgId });
    if (!msg) return next(sendError404Msg);

    res.status(200).json({
        status: 'ok',
        data: msg,
    });
});

export const editMessage = catchAsync(async (req, res, next) => {
    const { msgId } = req.params;
    const { content } = req.body;

    const msg = await Message.findByIdAndUpdate({ _id: msgId }, { $set: { content } }, { new: true });
    if (!msg) return next(sendError404Msg);

    res.status(200).json({
        status: 'ok',
        data: msg,
    });
});

export const deleteMessage = catchAsync(async (req, res, next) => {
    const { msgId } = req.params;
    const { _id: userId } = req.user!;

    const msg = await Message.findById({ _id: msgId, user: userId });
    if (!msg) return next(sendError404Msg);

    await Message.findByIdAndDelete({ _id: msgId });

    res.status(204).json({
        status: 'ok',
        message: 'Сообщение успешно удалено!',
    });
});
