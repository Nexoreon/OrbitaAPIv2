"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const notificationController_1 = require("../controllers/notificationController");
const common_1 = require("../utils/common");
const router = (0, express_1.Router)();
const restrictRole = 'Администратор';
router.route('/')
    .get(authController_1.protect, (0, authController_1.restrictTo)(restrictRole), notificationController_1.getNotifications)
    .post(authController_1.protect, (0, authController_1.restrictTo)(restrictRole), common_1.createNotification);
router.route('/:id')
    .get(authController_1.protect, notificationController_1.getNotification)
    .patch(authController_1.protect, (0, authController_1.restrictTo)(restrictRole), notificationController_1.updateNotification)
    .delete(authController_1.protect, (0, authController_1.restrictTo)(restrictRole), notificationController_1.deleteNotification);
exports.default = router;
