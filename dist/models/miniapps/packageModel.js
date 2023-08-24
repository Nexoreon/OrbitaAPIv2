"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const packageSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Укажите название пакета'],
        unique: true,
    },
    category: {
        type: String,
        required: [true, 'Укажите категорию пакета'],
    },
    description: {
        type: String,
        required: [true, 'Укажите описание пакета'],
    },
    isDevDep: Boolean,
    addedAt: {
        type: Date,
        default: Date.now,
    },
});
const Package = (0, mongoose_1.model)('npm-package', packageSchema);
exports.default = Package;
