import Story from '../models/storyModel';
import catchAsync from '../utils/catchAsync';
import { sendError } from '../utils/common';

// possible errors
const sendError404 = sendError('Такой истории не существует!', 404);

export const createStory = catchAsync(async (req, res) => {
    const newStory = await Story.create(req.body);

    res.status(201).json({
        status: 'ok',
        data: newStory,
    });
});

export const getStories = catchAsync(async (req, res) => {
    const stories = await Story.find();

    res.status(200).json({
        status: 'ok',
        data: stories,
    });
});

export const getStory = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const story = await Story.findById(id);
    if (!story) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        data: story,
    });
});

export const updateStory = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const story = await Story.findByIdAndUpdate(id, req.body, { new: true });
    if (!story) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        data: story,
    });
});

export const deleteStory = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const story = await Story.findByIdAndDelete(id);
    if (!story) return next(sendError404);

    res.status(204).json({
        status: 'ok',
        message: 'История успешно удалена',
    });
});
