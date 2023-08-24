"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const configurationController_1 = require("../controllers/configurationController");
const router = (0, express_1.Router)();
const restrictRole = 'Администратор';
router.route('/')
    .get(authController_1.protect, (0, authController_1.restrictTo)(restrictRole), configurationController_1.getConfigurations)
    .post(authController_1.protect, (0, authController_1.restrictTo)(restrictRole), configurationController_1.createConfiguration)
    .patch(authController_1.protect, (0, authController_1.restrictTo)(restrictRole), configurationController_1.changeConfiguration);
router.get('/getApp', authController_1.protect, (0, authController_1.restrictTo)(restrictRole), configurationController_1.getConfiguration);
router.patch('/changeParam', authController_1.protect, (0, authController_1.restrictTo)(restrictRole), configurationController_1.changeConfigurationParam);
exports.default = router;
