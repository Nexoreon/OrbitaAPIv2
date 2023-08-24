"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessage = exports.editMessage = exports.getMessage = exports.sendMessage = exports.deleteConversation = exports.createConversation = exports.getConversation = exports.getConversations = void 0;
const mongoose_1 = require("mongoose");
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const common_1 = require("../utils/common");
const conversationModel_1 = __importDefault(require("../models/messenger/conversationModel"));
const messageModel_1 = __importDefault(require("../models/messenger/messageModel"));
// possible errors
const sendError404 = (0, common_1.sendError)('Такого чата не существует или у вас нету доступа!', 404);
const sendError404Msg = (0, common_1.sendError)('Такого сообщения не существует!', 404);
exports.getConversations = (0, catchAsync_1.default)(async (req, res) => {
    const { _id: userId } = req.user;
    const commonPipeline = [
        { $unwind: { path: '$latestMessage', preserveNullAndEmptyArrays: true } },
        { $addFields: { unreadMessages: { $size: '$unreadMessages' } } },
        { $sort: { 'latestMessage.createdAt': -1 } },
    ];
    const convsMessages = await conversationModel_1.default.aggregate([
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
        ...commonPipeline,
    ]);
    const total = await conversationModel_1.default.countDocuments({ users: userId });
    res.status(200).json({
        status: 'ok',
        data: {
            total,
            items: convsMessages,
        },
    });
});
exports.getConversation = (0, catchAsync_1.default)(async (req, res, next) => {
    const { convId } = req.params;
    const { limit } = req.query;
    const { _id: userId } = req.user;
    const conversation = await conversationModel_1.default.findOne({ _id: convId, users: userId });
    if (!conversation)
        return next(sendError404);
    const messages = await messageModel_1.default.aggregate([
        { $match: { relatedTo: new mongoose_1.Types.ObjectId(convId), isInformational: { $exists: false } } },
        { $sort: { createdAt: 1 } },
        { $addFields: { day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } } },
        { $group: {
                _id: { createdAt: '$day' },
                items: { $push: '$$CURRENT' },
            },
        },
        { $project: { date: '$_id.createdAt', items: 1, _id: 0 } },
        { $limit: +limit },
        { $sort: { date: -1 } },
    ]);
    const total = await messageModel_1.default.countDocuments({ relatedTo: new mongoose_1.Types.ObjectId(convId), isInformational: { $exists: false } });
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
exports.createConversation = (0, catchAsync_1.default)(async (req, res) => {
    const { _id: userId } = req.user;
    const newConversation = await conversationModel_1.default.create({ ...req.body, users: userId });
    await messageModel_1.default.create({ relatedTo: newConversation._id, isInformational: true, content: 'Чат создан', readBy: [userId] });
    res.status(201).json({
        status: 'ok',
        data: newConversation,
    });
});
exports.deleteConversation = (0, catchAsync_1.default)(async (req, res, next) => {
    const { convId } = req.params;
    const conversation = await conversationModel_1.default.findById({ _id: convId });
    if (!conversation)
        return next(sendError404);
    await conversationModel_1.default.findByIdAndDelete({ _id: convId });
    await messageModel_1.default.deleteMany({ relatedTo: convId });
    res.status(204).json({
        status: 'ok',
        message: 'Чат успешно удалён',
    });
});
exports.sendMessage = (0, catchAsync_1.default)(async (req, res, next) => {
    const { _id: userId } = req.user;
    const { convId } = req.params;
    const conv = await conversationModel_1.default.findOne({ _id: convId, users: userId });
    if (!conv)
        return next(sendError404);
    const newMessage = await messageModel_1.default.create({ relatedTo: convId, user: userId, readBy: [userId], ...req.body });
    res.status(201).json({
        status: 'ok',
        data: newMessage,
    });
});
exports.getMessage = (0, catchAsync_1.default)(async (req, res, next) => {
    const { msgId } = req.params;
    const msg = await messageModel_1.default.findById({ _id: msgId });
    if (!msg)
        return next(sendError404Msg);
    res.status(200).json({
        status: 'ok',
        data: msg,
    });
});
exports.editMessage = (0, catchAsync_1.default)(async (req, res, next) => {
    const { msgId } = req.params;
    const { content } = req.body;
    const msg = await messageModel_1.default.findByIdAndUpdate({ _id: msgId }, { $set: { content } }, { new: true });
    if (!msg)
        return next(sendError404Msg);
    res.status(200).json({
        status: 'ok',
        data: msg,
    });
});
exports.deleteMessage = (0, catchAsync_1.default)(async (req, res, next) => {
    const { msgId } = req.params;
    const { _id: userId } = req.user;
    const msg = await messageModel_1.default.findById({ _id: msgId, user: userId });
    if (!msg)
        return next(sendError404Msg);
    await messageModel_1.default.findByIdAndDelete({ _id: msgId });
    res.status(204).json({
        status: 'ok',
        message: 'Сообщение успешно удалено!',
    });
});
