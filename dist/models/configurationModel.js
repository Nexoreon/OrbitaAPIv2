"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const configurationSchema = new mongoose_1.default.Schema({
    appId: {
        type: Number,
        required: [true, 'Необходимо указать ID приложения!'],
        unique: true,
    },
    appName: {
        type: String,
        required: [true, 'Необходимо указать название приложения!'],
        unique: true,
    },
    settings: Object,
}, {
    strict: false,
});
const Configuration = mongoose_1.default.model('application', configurationSchema);
exports.default = Configuration;
