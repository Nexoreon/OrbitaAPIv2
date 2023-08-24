import { Router } from 'express';
import { protect } from '../controllers/authController';
import { createIcon, getIcons } from '../controllers/iconController';

const router = Router();

router.route('/')
.get(protect, getIcons)
.post(protect, createIcon);

export default router;
