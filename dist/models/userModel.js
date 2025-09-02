"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-unused-vars */
/* eslint-disable object-shorthand */
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = require("mongoose");
const validator_1 = __importDefault(require("validator"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Имя пользователя должно быть заполнено'],
        unique: true,
    },
    email: {
        type: String,
        required: [true, 'Email адрес должен быть заполнен'],
        unique: true,
        lowercase: true, // Формирует поле в lowercase
        validate: [validator_1.default.isEmail, 'Пожалуйста введите корректный Email адрес'],
    },
    photo: String,
    role: {
        type: String,
        enum: ['Пользователь', 'Администратор'],
        default: 'Пользователь',
    },
    level: {
        current: {
            type: Number,
            default: 1,
        },
        xp: {
            type: Number,
            default: 0,
        },
        xpRequired: {
            type: Number,
            default: 100,
        },
        reward: {
            type: Number,
            default: 0,
        },
    },
    achievements: [Object],
    password: {
        type: String,
        required: [true, 'Необходимо заполнить пароль пользователя'],
        minlength: 8,
        select: false, // Не отсылать клиенту пароль даже в зашифрованном виде
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Пожалуйста подвердите ваш пароль введя его ещё раз'],
        validate: {
            validator: function (el) {
                return el === this.password; // Если совпадает проверочный пароль с паролем, то возвращается true
            },
            message: 'Пароли не совпадают! Убедитесь в правильности ввода пароля.',
        },
    },
    passwordChangedAt: Date,
    passwordResetExpires: Date,
    passwordResetToken: String,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
    registeredAt: {
        type: Date,
        default: Date.now,
    },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    this.password = await bcryptjs_1.default.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
});
userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew)
        return next();
    this.passwordChangedAt = Date.now() - 1000;
    next();
});
userSchema.pre('find', function (next) {
    this.find({ active: { $ne: false } });
    next();
});
userSchema.virtual('level.progress').get(function () {
    return (100 / this.level.xpRequired) * this.level.xp;
});
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return bcryptjs_1.default.compare(candidatePassword, userPassword);
};
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(`${this.passwordChangedAt.getTime() / 1000}`, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto_1.default.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};
const User = (0, mongoose_1.model)('user', userSchema);
exports.default = User;
