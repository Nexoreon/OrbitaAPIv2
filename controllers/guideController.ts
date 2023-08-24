import { sendError, toObjectId } from '../utils/common';
import catchAsync from '../utils/catchAsync';
import Guide from '../models/guides/guideModel';
import GuideSection from '../models/guides/guideSectionModel';
import GuideSectionPart from '../models/guides/guideSectionPartModel';

// possible errors
const sendError404 = sendError('Такого материала не найдено!', 404);
const sendError404Section = sendError('Такой секции не найдено!', 404);
const sendError404Part = sendError('Такой части секции не найдено!', 404);
const sendErrorSingleSection = sendError('Нельзя удалить единственную секцию материала!', 401);

export const getGuides = catchAsync(async (req, res) => {
    const { search } = req.query;
    const regexSearch = { $regex: search, $options: 'i' };

    const guides = await Guide.aggregate([
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

export const getGuide = catchAsync(async (req, res, next) => {
    const { guideId } = req.params;

    const guide = await Guide.aggregate([
        { $match: { _id: toObjectId(guideId) } },
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
    if (!guide.length) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        data: guide[0],
    });
});

export const getSection = catchAsync(async (req, res, next) => {
    const { sectionId } = req.params;

    const section = await GuideSection.findById(sectionId);
    if (!section) return next(sendError404Section);

    res.status(200).json({
        status: 'ok',
        data: section,
    });
});

export const getSectionPart = catchAsync(async (req, res, next) => {
    const { partId } = req.params;

    const part = await GuideSectionPart.findById(partId);
    if (!part) return next(sendError404Part);

    res.status(200).json({
        status: 'ok',
        data: part,
    });
});

// NOTE: create includes three controllers below
export const createGuide = catchAsync(async (req, res, next) => {
    const newGuide = await Guide.create(req.body);
    req.body = {
        ...req.body,
        guideId: newGuide._id,
        title: req.body.titleSection,
    };

    next();
});

export const createSection = catchAsync(async (req, res, next) => {
    const { guideId } = req.params;
    const { title, titlePart } = req.body;

    const newSection = await GuideSection.create({
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

export const createSectionPart = catchAsync(async (req, res) => {
    const { guideId, sectionId } = req.params;

    const newSectionPart = await GuideSectionPart.create({
        ...req.body,
        guideId: req.body.guideId || guideId,
        sectionId: req.body.sectionId || sectionId,
    });

    res.status(200).json({
        status: 'ok',
        data: newSectionPart,
    });
});

export const updateGuide = catchAsync(async (req, res, next) => {
    const { guideId } = req.params;

    const guide = await Guide.findByIdAndUpdate(guideId, {
        ...req.body,
        'meta.updatedAt': Date.now(),
    });
    if (!guide) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        message: 'Материал успешно обновлён',
    });
});

export const updateSection = catchAsync(async (req, res, next) => {
    const { sectionId } = req.params;

    const section = await GuideSection.findByIdAndUpdate(sectionId, req.body);
    if (!section) return next(sendError404Section);

    res.status(200).json({
        status: 'ok',
        message: 'Секция успешно обновлена',
    });
});

export const updateSectionPart = catchAsync(async (req, res, next) => {
    const { partId } = req.params;

    const part = await GuideSectionPart.findByIdAndUpdate(partId, req.body);
    if (!part) return next(sendError404Part);

    res.status(200).json({
        status: 'ok',
        message: 'Часть секции успешно обновлена',
    });
});

export const deleteGuide = catchAsync(async (req, res, next) => {
    const { guideId } = req.params;

    const guide = await Guide.findByIdAndDelete(guideId);
    if (!guide) return next(sendError404);
    await GuideSection.deleteMany({ guideId });
    await GuideSectionPart.deleteMany({ guideId });

    res.status(204).json({
        status: 'ok',
        message: 'Материал успешно удалён',
    });
});

export const deleteSection = catchAsync(async (req, res, next) => {
    const { guideId, sectionId } = req.params;

    const sections = await GuideSection.find({ guideId }).countDocuments();
    if (sections === 0) return next(sendError404Section);
    if (sections <= 1) return next(sendErrorSingleSection);

    await GuideSection.findByIdAndDelete(sectionId);
    await GuideSectionPart.deleteMany({ sectionId });

    res.status(204).json({
        status: 'ok',
        message: 'Секция успешно удалена',
    });
});

export const deleteSectionPart = catchAsync(async (req, res, next) => {
    const { partId } = req.params;

    const sectionPart = await GuideSectionPart.findByIdAndDelete(partId);
    if (!sectionPart) return next(sendError404Part);

    res.status(204).json({
        status: 'ok',
        message: 'Часть секции успешно удалена',
    });
});
