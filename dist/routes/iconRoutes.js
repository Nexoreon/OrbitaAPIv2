"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const iconController_1 = require("../controllers/iconController");
const router = (0, express_1.Router)();
router.route('/')
    .get(authController_1.protect, iconController_1.getIcons)
    .post(authController_1.protect, iconController_1.createIcon);
exports.default = router;
