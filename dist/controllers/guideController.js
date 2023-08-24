"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSectionPart = exports.deleteSection = exports.deleteGuide = exports.updateSectionPart = exports.updateSection = exports.updateGuide = exports.createSectionPart = exports.createSection = exports.createGuide = exports.getSectionPart = exports.getSection = exports.getGuide = exports.getGuides = void 0;
const common_1 = require("../utils/common");
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const guideModel_1 = __importDefault(require("../models/guides/guideModel"));
const guideSectionModel_1 = __importDefault(require("../models/guides/guideSectionModel"));
const guideSectionPartModel_1 = __importDefault(require("../models/guides/guideSectionPartModel"));
// possible errors
const sendError404 = (0, common_1.sendError)('Такого материала не найдено!', 404);
const sendError404Section = (0, common_1.sendError)('Такой секции не найдено!', 404);
const sendError404Part = (0, common_1.sendError)('Такой части секции не найдено!', 404);
const sendErrorSingleSection = (0, common_1.sendError)('Нельзя удалить единственную секцию материала!', 401);
exports.getGuides = (0, catchAsync_1.default)(async (req, res) => {
    const { search } = req.query;
    const regexSearch = { $regex: search, $options: 'i' };
    const guides = await guideModel_1.default.aggregate([
        {
            $lookup: {
                from: 'guides_sections',
                let: { guideId: '$_id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$guideId', '$$guideId'] }, ...(search && { title: regexSearch }) } },
                    { $project: { _id: 1 } },
                ],
                as: 'sections',
            },
        },
        {
            $lookup: {
                from: 'guides_parts',
                let: { guideId: '$_id' },
                pipeline: [
                    { $match: {
                            $or: [
                                { $expr: { $eq: ['$guideId', '$$guideId'] }, ...(search && { title: regexSearch }) },
                                { $expr: { $eq: ['$guideId', '$$guideId'] }, ...(search && { content: regexSearch }) },
                            ],
                        } },
                    { $project: { _id: 1 } },
                ],
                as: 'parts',
            },
        },
        {
            $sort: { 'meta.createdAt': -1 },
        },
        {
            $match: search ? { $or: [{ title: regexSearch }, { $or: [{ sections: { $ne: [] } }, { parts: { $ne: [] } }] }] } : {},
        },
        {
            $group: { _id: '$category', total: { $sum: 1 }, items: { $push: '$$ROOT' } },
        },
        {
            $project: { _id: 0, category: '$_id', total: 1, items: 1, meta: 1 },
        },
    ]);
    const total = guides.length;
    res.status(200).json({
        status: 'ok',
        data: { total, items: guides },
    });
});
exports.getGuide = (0, catchAsync_1.default)(async (req, res, next) => {
    const { guideId } = req.params;
    const guide = await guideModel_1.default.aggregate([
        { $match: { _id: (0, common_1.toObjectId)(guideId) } },
        {
            $lookup: {
                from: 'guides_sections',
                let: { guideId: '$_id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$guideId', '$$guideId'] } } },
                    { $lookup: {
                            from: 'guides_parts',
                            let: { sectionId: '$_id' },
                            pipeline: [
                                { $match: { $expr: { $eq: ['$sectionId', '$$sectionId'] } } },
                            ],
                            as: 'parts',
                        } },
                ],
                as: 'sections',
            },
        },
    ]);
    if (!guide.length)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        data: guide[0],
    });
});
exports.getSection = (0, catchAsync_1.default)(async (req, res, next) => {
    const { sectionId } = req.params;
    const section = await guideSectionModel_1.default.findById(sectionId);
    if (!section)
        return next(sendError404Section);
    res.status(200).json({
        status: 'ok',
        data: section,
    });
});
exports.getSectionPart = (0, catchAsync_1.default)(async (req, res, next) => {
    const { partId } = req.params;
    const part = await guideSectionPartModel_1.default.findById(partId);
    if (!part)
        return next(sendError404Part);
    res.status(200).json({
        status: 'ok',
        data: part,
    });
});
// NOTE: create includes three controllers below
exports.createGuide = (0, catchAsync_1.default)(async (req, res, next) => {
    const newGuide = await guideModel_1.default.create(req.body);
    req.body = {
        ...req.body,
        guideId: newGuide._id,
        title: req.body.titleSection,
    };
    next();
});
exports.createSection = (0, catchAsync_1.default)(async (req, res, next) => {
    const { guideId } = req.params;
    const { title, titlePart } = req.body;
    const newSection = await guideSectionModel_1.default.create({
        guideId: req.body.guideId || guideId,
        title,
    });
    req.body = {
        ...req.body,
        guideId: req.body.guideId || guideId,
        sectionId: newSection._id,
        title: titlePart,
    };
    next();
});
exports.createSectionPart = (0, catchAsync_1.default)(async (req, res) => {
    const { guideId, sectionId } = req.params;
    const newSectionPart = await guideSectionPartModel_1.default.create({
        ...req.body,
        guideId: req.body.guideId || guideId,
        sectionId: req.body.sectionId || sectionId,
    });
    res.status(200).json({
        status: 'ok',
        data: newSectionPart,
    });
});
exports.updateGuide = (0, catchAsync_1.default)(async (req, res, next) => {
    const { guideId } = req.params;
    const guide = await guideModel_1.default.findByIdAndUpdate(guideId, {
        ...req.body,
        'meta.updatedAt': Date.now(),
    });
    if (!guide)
        return next(sendError404);
    res.status(200).json({
        status: 'ok',
        message: 'Материал успешно обновлён',
    });
});
exports.updateSection = (0, catchAsync_1.default)(async (req, res, next) => {
    const { sectionId } = req.params;
    const section = await guideSectionModel_1.default.findByIdAndUpdate(sectionId, req.body);
    if (!section)
        return next(sendError404Section);
    res.status(200).json({
        status: 'ok',
        message: 'Секция успешно обновлена',
    });
});
exports.updateSectionPart = (0, catchAsync_1.default)(async (req, res, next) => {
    const { partId } = req.params;
    const part = await guideSectionPartModel_1.default.findByIdAndUpdate(partId, req.body);
    if (!part)
        return next(sendError404Part);
    res.status(200).json({
        status: 'ok',
        message: 'Часть секции успешно обновлена',
    });
});
exports.deleteGuide = (0, catchAsync_1.default)(async (req, res, next) => {
    const { guideId } = req.params;
    const guide = await guideModel_1.default.findByIdAndDelete(guideId);
    if (!guide)
        return next(sendError404);
    await guideSectionModel_1.default.deleteMany({ guideId });
    await guideSectionPartModel_1.default.deleteMany({ guideId });
    res.status(204).json({
        status: 'ok',
        message: 'Материал успешно удалён',
    });
});
exports.deleteSection = (0, catchAsync_1.default)(async (req, res, next) => {
    const { guideId, sectionId } = req.params;
    const sections = await guideSectionModel_1.default.find({ guideId }).countDocuments();
    if (sections === 0)
        return next(sendError404Section);
    if (sections <= 1)
        return next(sendErrorSingleSection);
    await guideSectionModel_1.default.findByIdAndDelete(sectionId);
    await guideSectionPartModel_1.default.deleteMany({ sectionId });
    res.status(204).json({
        status: 'ok',
        message: 'Секция успешно удалена',
    });
});
exports.deleteSectionPart = (0, catchAsync_1.default)(async (req, res, next) => {
    const { partId } = req.params;
    const sectionPart = await guideSectionPartModel_1.default.findByIdAndDelete(partId);
    if (!sectionPart)
        return next(sendError404Part);
    res.status(204).json({
        status: 'ok',
        message: 'Часть секции успешно удалена',
    });
});
