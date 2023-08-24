import { Router } from 'express';
import { protect, restrictTo } from '../controllers/authController';
import { changeConfiguration, changeConfigurationParam, createConfiguration, getConfiguration, getConfigurations } from '../controllers/configurationController';

const router = Router();

const restrictRole = 'Администратор';
router.route('/')
.get(protect, restrictTo(restrictRole), getConfigurations)
.post(protect, restrictTo(restrictRole), createConfiguration)
.patch(protect, restrictTo(restrictRole), changeConfiguration);

router.get('/getApp', protect, restrictTo(restrictRole), getConfiguration);
router.patch('/changeParam', protect, restrictTo(restrictRole), changeConfigurationParam);

export default router;
