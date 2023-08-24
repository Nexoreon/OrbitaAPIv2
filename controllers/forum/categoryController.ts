import { sendError } from '../../utils/common';
import catchAsync from '../../utils/catchAsync';
import Category from '../../models/forum/categoryModel';

// possible errors
const sendError404 = sendError('Такой категории не найдено', 404);

export const getAllCategories = catchAsync(async (req, res) => {
    const query = { parentId: { $exists: false } };
    const categories = await Category.find(query);
    const length = await Category.countDocuments(query);

    res.status(200).json({
        status: 'ok',
        length,
        data: categories,
    });
});

export const getAllSubCategories = catchAsync(async (req, res) => {
    const query = { parentId: { $exists: true } };
    const subCategories = await Category.find(query);
    const length = await Category.countDocuments(query);

    res.status(200).json({
        status: 'ok',
        length,
        data: subCategories,
    });
});

export const getEverything = catchAsync(async (req, res) => {
    const { withTopics } = req.query;
    let query = Category.find();
    if (withTopics) query = Category.find({ topics: { $ne: [] } });

    const categories = await query;
    // TODO: Change variable length logic to total
    // eslint-disable-next-line prefer-destructuring
    const length = categories.length;

    res.status(200).json({
        status: 'ok',
        length,
        data: categories,
    });
});

export const getCategory = catchAsync(async (req, res, next) => {
    const category = await Category.findById(req.params.id);
    if (!category) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        data: category,
    });
});

export const createCategory = catchAsync(async (req, res) => {
    const { parentId } = req.query;
    if (parentId) req.body = { ...req.body, parentId };
    const newCategory = await Category.create(req.body);

    if (parentId) {
        await Category.findByIdAndUpdate(parentId, {
            $addToSet: { subCategories: newCategory._id },
        }, { new: true });
    }

    res.status(201).json({
        status: 'ok',
        data: newCategory,
    });
});

export const updateCategory = catchAsync(async (req, res, next) => {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });
    if (!category) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        data: category,
    });
});

export const deleteCategory = catchAsync(async (req, res, next) => {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return next(sendError404);

    if (category.subCategories.length) {
        await Category.updateMany({ _id: category.subCategories }, {
            $unset: { parentId: '' },
        });
    }

    req.body.categoryId = category._id;
    next();
});
