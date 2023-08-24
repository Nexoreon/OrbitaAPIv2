import { Router } from 'express';
import { protect } from '../controllers/authController';
import {
    createGuide,
    createSection,
    createSectionPart,
    deleteGuide,
    deleteSection,
    deleteSectionPart,
    getGuide,
    getGuides,
    getSection,
    getSectionPart,
    updateGuide,
    updateSection,
    updateSectionPart,
} from '../controllers/guideController';

const router = Router();

router.route('/')
.get(protect, getGuides)
.post(protect, createGuide, createSection, createSectionPart);

router.route('/:guideId')
.get(protect, getGuide)
.patch(protect, updateGuide)
.delete(protect, deleteGuide);

router.post('/:guide/sections', protect, createSection, createSectionPart);

router.route('/:guideId/sections/:sectionId')
.get(protect, getSection)
.post(protect, createSectionPart)
.patch(protect, updateSection)
.delete(protect, deleteSection);

router.route('/:guideId/parts/:partId')
.get(protect, getSectionPart)
.patch(protect, updateSectionPart)
.delete(protect, deleteSectionPart);

export default router;
