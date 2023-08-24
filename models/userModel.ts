/* eslint-disable no-unused-vars */
/* eslint-disable object-shorthand */
import crypto from 'crypto';
import { Document, model, Model, Schema, Types } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    _id: Types.ObjectId,
    name: string,
    email: string,
    photo: string,
    role: string,
    level: {
        current: number,
        xp: number,
        xpRequired: number,
        reward: number,
    },
    achievements: object[],
    password: string,
    passwordConfirm: string | undefined,
    passwordChangedAt: Date | number,
    passwordResetExpires: Date | undefined,
    passwordResetToken: string | undefined,
    active: boolean,
    registeredAt: Date,
}

interface IUserMethods {
    correctPassword(candidatePassword: string, userPassword: string): Promise<boolean>;
    changedPasswordAfter(JWTTimestamp: number): boolean;
    createPasswordResetToken(): string;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>({
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
        validate: [validator.isEmail, 'Пожалуйста введите корректный Email адрес'],
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
        validate: { // Работает только при создание и сохранение (save) пользователя!!!
            validator: function (this: IUser, el: string) {
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
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

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

userSchema.methods.correctPassword = async function (candidatePassword: string, userPassword: string) {
    return bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp: number) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(`${this.passwordChangedAt.getTime() / 1000}`, 10);
        return JWTTimestamp < changedTimestamp;
    }

    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const User = model<IUser, UserModel>('user', userSchema);

export default User;
