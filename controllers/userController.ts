import sharp from 'sharp';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';
import Notification from '../models/notificationModel';
import User from '../models/userModel';
import uploadFile from '../utils/uploadFile';

export const getUsers = catchAsync(async (req, res) => {
    const users = await User.find();
    const total = await User.countDocuments();

    res.status(200).json({
        status: 'ok',
        data: {
            total,
            items: users,
        },
    });
});

export const getUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('Неверный ID или такой пользователь не существует!', 404));

    res.status(200).json({
        status: 'ok',
        data: user,
    });
});

export const getMyProfile = catchAsync(async (req, res) => {
    const { _id: userId } = req.user!;
    const user = await User.findById(userId, { photo: 1, name: 1, email: 1, level: 1 });
    const unreadNotifications = await Notification.countDocuments({
        receivers: { $in: userId },
        hiddenFor: { $ne: userId },
        readBy: { $ne: userId },
        sendOut: { $lte: Date.now() },
    });

    res.status(200).json({
        status: 'ok',
        data: { user, unreadNotifications },
    });
});

export const updateMe = catchAsync(async (req, res, next) => {
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('Этот путь не предназначен для обновления пароля. Пожалуйста воспользуйтесь путём /updateMyPassword', 400));
    }

    const filterObj = (obj: { [el: string] : string }, ...allowedFields: string[]) => {
        const newObj: { [key: string]: string } = { type: 'string' };
        Object.keys(obj).forEach((el: string) => {
            if (allowedFields.includes(el)) newObj[el] = obj[el];
        });
        return newObj;
    };

    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file) filteredBody.photo = req.file.filename;
    const updatedUser = await User.findByIdAndUpdate(req.user?.id, filteredBody, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        status: 'ok',
        data: updatedUser,
    });
});

export const uploadUserPhoto = uploadFile.single('photo');
export const resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();
    req.file.filename = `user-${req.user!.id}-${Date.now()}.jpeg`;
    await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg').jpeg({ quality: 90 })
    .toFile(`../../site/public/img/users/${req.file.filename}`);
    next();
});

export const deleteMe = catchAsync(async (req, res) => {
    await User.findByIdAndUpdate(req.user!.id, { active: false });

    res.status(200).json({
        status: 'ok',
        message: 'Профиль успешно удалён!',
    });
});

export const getUserProgress = catchAsync(async (req, res) => {
    const { _id: userId } = req.user!;
    const level = await User.findById({ _id: userId }, { level: 1, _id: 0 });

    res.status(200).json({
        status: 'ok',
        data: { level: level!.level },
    });
});
