"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const documentController_1 = require("../controllers/documentController");
const router = (0, express_1.Router)();
router.route('/')
    .get(authController_1.protect, documentController_1.getGuides)
    .post(authController_1.protect, documentController_1.createGuide, documentController_1.createSection, documentController_1.createSectionPart);
router.route('/:guideId')
    .get(authController_1.protect, documentController_1.getGuide)
    .patch(authController_1.protect, documentController_1.updateGuide)
    .delete(authController_1.protect, documentController_1.deleteGuide);
router.post('/:guide/sections', authController_1.protect, documentController_1.createSection, documentController_1.createSectionPart);
router.route('/:guideId/sections/:sectionId')
    .get(authController_1.protect, documentController_1.getSection)
    .post(authController_1.protect, documentController_1.createSectionPart)
    .patch(authController_1.protect, documentController_1.updateSection)
    .delete(authController_1.protect, documentController_1.deleteSection);
router.route('/:guideId/parts/:partId')
    .get(authController_1.protect, documentController_1.getSectionPart)
    .patch(authController_1.protect, documentController_1.updateSectionPart)
    .delete(authController_1.protect, documentController_1.deleteSectionPart);
exports.default = router;
