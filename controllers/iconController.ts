import catchAsync from '../utils/catchAsync';
import Icon from '../models/iconModel';

export const createIcon = catchAsync(async (req, res) => {
    const newIcon = await Icon.create(req.body);

    res.status(201).json({
        status: 'ok',
        data: newIcon,
    });
});

export const getIcons = catchAsync(async (req, res) => {
    const { query } = req.query;
    const icons = await Icon.find(query ? { name: { $regex: query, $options: 'i' } } : {}).limit(!query ? 50 : 0);
    const total = icons.length;

    res.status(200).json({
        status: 'ok',
        data: { items: icons, total },
    });
});
