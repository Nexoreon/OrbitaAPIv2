import catchAsync from '../../utils/catchAsync';
import { sendError } from '../../utils/common';
import Package from '../../models/miniapps/packageModel';

// possible errors
const sendError404 = sendError('Такого пакета не найдено!', 404);

// eslint-disable-next-line no-unused-vars
const categories = [
    'Фреймворки',
    'TypeScript',
    'Редакторы текста/кода',
    'Webpack и его плагины',
    'React и его плагины',
    'Babel и его плагины',
    'Сервер и API',
    'Валидаторы',
    'Другое',
];

export const getPackages = catchAsync(async (req, res) => {
    const packages = await Package.aggregate([
        { $group: { _id: '$category', total: { $sum: 1 }, items: { $push: '$$ROOT' } } },
        { $project: { category: '$_id', total: 1, items: 1, _id: 0 } },
    ]);
    const total = await Package.countDocuments();

    res.status(200).json({
        status: 'ok',
        data: { total, packages },
    });
});

export const getPackage = catchAsync(async (req, res, next) => {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        data: pkg,
    });
});

export const createPackage = catchAsync(async (req, res) => {
    const pkg = await Package.create(req.body);

    res.status(201).json({
        status: 'ok',
        data: pkg,
    });
});

export const updatePackage = catchAsync(async (req, res, next) => {
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pkg) return next(sendError404);

    res.status(200).json({
        status: 'ok',
        data: pkg,
    });
});

export const deletePackage = catchAsync(async (req, res, next) => {
    const pkg = await Package.findByIdAndDelete(req.params.id);
    if (!pkg) return next(sendError404);

    res.status(204).json({
        status: 'ok',
        message: 'Пакет успешно удалён',
    });
});
