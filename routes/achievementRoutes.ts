import { Router } from 'express';
import { protect } from '../controllers/authController';
import {
    createAchievement,
    deleteAchievement,
    getAchievement,
    getAchievements,
    getUserAchievements,
    updateAchievement,
    updateProgress,
} from '../controllers/achievementsController';

const router = Router();

router.route('/')
.get(protect, getAchievements)
.post(protect, createAchievement);

router.get('/getUserAchievements', protect, getUserAchievements);
router.patch('/updateProgress', protect, updateProgress);

router.route('/:achievementId')
.get(protect, getAchievement)
.patch(protect, updateAchievement)
.delete(protect, deleteAchievement);

export default router;
