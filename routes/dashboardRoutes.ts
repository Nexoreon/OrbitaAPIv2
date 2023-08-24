import { Router } from 'express';
import { protect } from '../controllers/authController';
import { getDashboardData } from '../controllers/dashboardController';
import { createStory, deleteStory, getStories, getStory, updateStory } from '../controllers/storyController';

const router = Router();

router.get('/getDashboardData', protect, getDashboardData);
router.route('/articles')
.get(protect, getStories)
.post(protect, createStory);
router.route('/articles/:id')
.get(protect, getStory)
.patch(protect, updateStory)
.delete(protect, deleteStory);

export default router;
