import { Router } from 'express';
import { getAppData, getModerationData, moderationDeleteMany, returnImage, searchData, uploadImage } from '../controllers/mainController';
import { protect, restrictTo } from '../controllers/authController';

const router = Router();

router.get('/app/getAppData', protect, getAppData);
router.get('/app/search', protect, searchData);
router.get('/moderation', protect, restrictTo('Администратор'), getModerationData);
router.delete('/moderation/deleteMany', protect, restrictTo('Администратор'), moderationDeleteMany);
router.post('/upload/img', protect, uploadImage, returnImage);

export default router;
