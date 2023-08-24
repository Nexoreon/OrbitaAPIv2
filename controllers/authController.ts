/* eslint-disable no-console */
import crypto from 'crypto';
import { promisify } from 'util';
import mongoose from 'mongoose';
import { Response } from 'express';
import jwt from 'jsonwebtoken';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/AppError';
import sendEmail from '../utils/email';
import User, { IUser } from '../models/userModel';

const signToken = (id: mongoose.Types.ObjectId) => jwt.sign({ id }, process.env.TOKEN_KEY!, {
    expiresIn: '7d',
});

const createSendToken = (user: IUser, statusCode: number, res: Response) => {
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

export const signup = catchAsync(async (req, res) => {
    const { name, email, password, passwordConfirm } = req.body;
    const newUser = await User.create({ name, email, password, passwordConfirm });

    createSendToken(newUser, 201, res);
});

export const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) return next(new AppError('Почта и пароль должны быть заполнены!', 400));

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Неправильная почта или пароль!', 401));
    }

    createSendToken(user, 200, res);
});

export const protect = catchAsync(async (req, res, next) => {
    let token: string | undefined;
    const { authorization } = req.headers;

    // eslint-disable-next-line prefer-destructuring
    if (authorization && authorization.startsWith('Bearer')) token = authorization.split(' ')[1];
    if (!token) return next(new AppError('Вы не авторизированы для проведения этой операции!', 401));

    const decoded = await promisify<string, string>(jwt.verify)(token, process.env.TOKEN_KEY!) as any;

    const freshUser = await User.findOne({ _id: decoded.id });
    if (!freshUser) return next(new AppError('Токен больше не действителен, так как данный пользователь удалён!', 401));
    if (freshUser.changedPasswordAfter(decoded.iat)) return next(new AppError('Пользователь недавно изменил пароль! Пожалуйста переавторизируйтесь!', 401));

    req.user = freshUser;
    next();
});

export const restrictTo = (...roles: string[]) => catchAsync(async (req, res, next) => {
    if (!roles.includes(req.user!.role)) return next(new AppError('У вас нет права выполнять эту операцию!', 403));
    next();
});

export const forgotPassword = catchAsync(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return next(new AppError('Пользователя с таким почтовым адресом не найдено!', 404));

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Забыли пароль? Отправь PATCH запрос с новым паролем на ${resetURL}`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Ваш токен восстановления пароля',
            message,
        });

        res.status(200).json({
            status: 'ok',
            message: 'Токен отправлен на почту!',
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('Произошла ошибка отправки сообщения! Попробуйте позже...', 500));
    }
});

export const resetPassword = catchAsync(async (req, res, next) => {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });
    if (!user) return next(new AppError('Неверный токен или он истёк', 400));

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();
    createSendToken(user, 200, res);
});

export const updatePasswords = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user!.id).select('+password');
    if (!user) return next(new AppError('Пользователь не найден!', 404));
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Текущий пароль указан неверно!', 401));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    createSendToken(user, 200, res);
});
