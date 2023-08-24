"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const achievementsController_1 = require("../controllers/achievementsController");
const router = (0, express_1.Router)();
router.route('/')
    .get(authController_1.protect, achievementsController_1.getAchievements)
    .post(authController_1.protect, achievementsController_1.createAchievement);
router.get('/getUserAchievements', authController_1.protect, achievementsController_1.getUserAchievements);
router.patch('/updateProgress', authController_1.protect, achievementsController_1.updateProgress);
router.route('/:achievementId')
    .get(authController_1.protect, achievementsController_1.getAchievement)
    .patch(authController_1.protect, achievementsController_1.updateAchievement)
    .delete(authController_1.protect, achievementsController_1.deleteAchievement);
exports.default = router;
