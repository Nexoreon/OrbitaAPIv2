"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProgress = exports.deleteMe = exports.resizeUserPhoto = exports.uploadUserPhoto = exports.updateMe = exports.getMyProfile = exports.getUser = exports.getUsers = void 0;
const sharp_1 = __importDefault(require("sharp"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const uploadFile_1 = __importDefault(require("../utils/uploadFile"));
exports.getUsers = (0, catchAsync_1.default)(async (req, res) => {
    const users = await userModel_1.default.find();
    const total = await userModel_1.default.countDocuments();
    res.status(200).json({
        status: 'ok',
        data: {
            total,
            items: users,
        },
    });
});
exports.getUser = (0, catchAsync_1.default)(async (req, res, next) => {
    const user = await userModel_1.default.findById(req.params.id);
    if (!user)
        return next(new AppError_1.default('Неверный ID или такой пользователь не существует!', 404));
    res.status(200).json({
        status: 'ok',
        data: user,
    });
});
exports.getMyProfile = (0, catchAsync_1.default)(async (req, res) => {
    const { _id: userId } = req.user;
    const user = await userModel_1.default.findById(userId, { photo: 1, name: 1, level: 1 });
    const unreadNotifications = await notificationModel_1.default.countDocuments({
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
exports.updateMe = (0, catchAsync_1.default)(async (req, res, next) => {
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError_1.default('Этот путь не предназначен для обновления пароля. Пожалуйста воспользуйтесь путём /updateMyPassword', 400));
    }
    const filterObj = (obj, ...allowedFields) => {
        const newObj = { type: 'string' };
        Object.keys(obj).forEach((el) => {
            if (allowedFields.includes(el))
                newObj[el] = obj[el];
        });
        return newObj;
    };
    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file)
        filteredBody.photo = req.file.filename;
    const updatedUser = await userModel_1.default.findByIdAndUpdate(req.user?.id, filteredBody, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        status: 'ok',
        data: updatedUser,
    });
});
exports.uploadUserPhoto = uploadFile_1.default.single('photo');
exports.resizeUserPhoto = (0, catchAsync_1.default)(async (req, res, next) => {
    if (!req.file)
        return next();
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
    await (0, sharp_1.default)(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg').jpeg({ quality: 90 })
        .toFile(`../../site/public/img/users/${req.file.filename}`);
    next();
});
exports.deleteMe = (0, catchAsync_1.default)(async (req, res) => {
    await userModel_1.default.findByIdAndUpdate(req.user.id, { active: false });
    res.status(200).json({
        status: 'ok',
        message: 'Профиль успешно удалён!',
    });
});
exports.getUserProgress = (0, catchAsync_1.default)(async (req, res) => {
    const { _id: userId } = req.user;
    const level = await userModel_1.default.findById({ _id: userId }, { level: 1, _id: 0 });
    res.status(200).json({
        status: 'ok',
        data: { level: level.level },
    });
});
