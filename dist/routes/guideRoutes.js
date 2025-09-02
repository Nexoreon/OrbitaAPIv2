"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const guideController_1 = require("../controllers/guideController");
const router = (0, express_1.Router)();
router.route('/')
    .get(authController_1.protect, guideController_1.getGuides)
    .post(authController_1.protect, guideController_1.createGuide, guideController_1.createSection, guideController_1.createSectionPart);
router.route('/:guideId')
    .get(authController_1.protect, guideController_1.getGuide)
    .patch(authController_1.protect, guideController_1.updateGuide)
    .delete(authController_1.protect, guideController_1.deleteGuide);
router.post('/:guideId/sections', authController_1.protect, guideController_1.createSection, guideController_1.createSectionPart);
router.route('/:guideId/sections/:sectionId')
    .get(authController_1.protect, guideController_1.getSection)
    .post(authController_1.protect, guideController_1.createSectionPart)
    .patch(authController_1.protect, guideController_1.updateSection)
    .delete(authController_1.protect, guideController_1.deleteSection);
router.route('/:guideId/parts/:partId')
    .get(authController_1.protect, guideController_1.getSectionPart)
    .patch(authController_1.protect, guideController_1.updateSectionPart)
    .delete(authController_1.protect, guideController_1.deleteSectionPart);
exports.default = router;
