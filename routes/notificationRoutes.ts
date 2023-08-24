import { Router } from 'express';
import { protect, restrictTo } from '../controllers/authController';
import { deleteNotification, getNotification, getNotifications, updateNotification } from '../controllers/notificationController';
import { createNotification } from '../utils/common';

const router = Router();
const restrictRole = 'Администратор';

router.route('/')
.get(protect, restrictTo(restrictRole), getNotifications)
.post(protect, restrictTo(restrictRole), createNotification);

router.route('/:id')
.get(protect, getNotification)
.patch(protect, restrictTo(restrictRole), updateNotification)
.delete(protect, restrictTo(restrictRole), deleteNotification);

export default router;
