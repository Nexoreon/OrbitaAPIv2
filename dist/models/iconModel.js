"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const iconSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Необходимо ввести код иконки'],
    },
    isBrand: {
        type: Boolean,
        default: false,
    },
});
const Icon = (0, mongoose_1.model)('fa_icons', iconSchema);
exports.default = Icon;
