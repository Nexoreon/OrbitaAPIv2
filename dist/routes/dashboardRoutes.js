"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const dashboardController_1 = require("../controllers/dashboardController");
const storyController_1 = require("../controllers/storyController");
const router = (0, express_1.Router)();
router.get('/getDashboardData', authController_1.protect, dashboardController_1.getDashboardData);
router.route('/articles')
    .get(authController_1.protect, storyController_1.getStories)
    .post(authController_1.protect, storyController_1.createStory);
router.route('/articles/:id')
    .get(authController_1.protect, storyController_1.getStory)
    .patch(authController_1.protect, storyController_1.updateStory)
    .delete(authController_1.protect, storyController_1.deleteStory);
exports.default = router;
