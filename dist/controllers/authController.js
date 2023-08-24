"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePasswords = exports.resetPassword = exports.forgotPassword = exports.restrictTo = exports.protect = exports.login = exports.signup = void 0;
/* eslint-disable no-console */
const crypto_1 = __importDefault(require("crypto"));
const util_1 = require("util");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const catchAsync_1 = __importDefault(require("../utils/catchAsync"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const email_1 = __importDefault(require("../utils/email"));
const userModel_1 = __importDefault(require("../models/userModel"));
const signToken = (id) => jsonwebtoken_1.default.sign({ id }, process.env.TOKEN_KEY, {
    expiresIn: '7d',
});
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    res.cookie('jwt', token, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true, // protects from CSSA attacks
    });
    user.password = '';
    const { _id: id, name, email, photo: avatar, role } = user;
    res.status(statusCode).json({
        status: 'ok',
        expiresIn: Date.now() + 7 * 24 * 60 * 60 * 1000,
        token,
        id,
        name,
        email,
        avatar,
        role,
    });
};
exports.signup = (0, catchAsync_1.default)(async (req, res) => {
    const { name, email, password, passwordConfirm } = req.body;
    const newUser = await userModel_1.default.create({ name, email, password, passwordConfirm });
    createSendToken(newUser, 201, res);
});
exports.login = (0, catchAsync_1.default)(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password)
        return next(new AppError_1.default('Почта и пароль должны быть заполнены!', 400));
    const user = await userModel_1.default.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError_1.default('Неправильная почта или пароль!', 401));
    }
    createSendToken(user, 200, res);
});
exports.protect = (0, catchAsync_1.default)(async (req, res, next) => {
    let token;
    const { authorization } = req.headers;
    // eslint-disable-next-line prefer-destructuring
    if (authorization && authorization.startsWith('Bearer'))
        token = authorization.split(' ')[1];
    if (!token)
        return next(new AppError_1.default('Вы не авторизированы для проведения этой операции!', 401));
    const decoded = await (0, util_1.promisify)(jsonwebtoken_1.default.verify)(token, process.env.TOKEN_KEY);
    const freshUser = await userModel_1.default.findOne({ _id: decoded.id });
    if (!freshUser)
        return next(new AppError_1.default('Токен больше не действителен, так как данный пользователь удалён!', 401));
    if (freshUser.changedPasswordAfter(decoded.iat))
        return next(new AppError_1.default('Пользователь недавно изменил пароль! Пожалуйста переавторизируйтесь!', 401));
    req.user = freshUser;
    next();
});
const restrictTo = (...roles) => (0, catchAsync_1.default)(async (req, res, next) => {
    if (!roles.includes(req.user.role))
        return next(new AppError_1.default('У вас нет права выполнять эту операцию!', 403));
    next();
});
exports.restrictTo = restrictTo;
exports.forgotPassword = (0, catchAsync_1.default)(async (req, res, next) => {
    const user = await userModel_1.default.findOne({ email: req.body.email });
    if (!user)
        return next(new AppError_1.default('Пользователя с таким почтовым адресом не найдено!', 404));
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Забыли пароль? Отправь PATCH запрос с новым паролем на ${resetURL}`;
    try {
        await (0, email_1.default)({
            email: user.email,
            subject: 'Ваш токен восстановления пароля',
            message,
        });
        res.status(200).json({
            status: 'ok',
            message: 'Токен отправлен на почту!',
        });
    }
    catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError_1.default('Произошла ошибка отправки сообщения! Попробуйте позже...', 500));
    }
});
exports.resetPassword = (0, catchAsync_1.default)(async (req, res, next) => {
    const hashedToken = crypto_1.default.createHash('sha256').update(req.params.token).digest('hex');
    const user = await userModel_1.default.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });
    if (!user)
        return next(new AppError_1.default('Неверный токен или он истёк', 400));
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    createSendToken(user, 200, res);
});
exports.updatePasswords = (0, catchAsync_1.default)(async (req, res, next) => {
    const user = await userModel_1.default.findById(req.user.id).select('+password');
    if (!user)
        return next(new AppError_1.default('Пользователь не найден!', 404));
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError_1.default('Текущий пароль указан неверно!', 401));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    createSendToken(user, 200, res);
});
