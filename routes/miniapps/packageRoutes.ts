import { Router } from 'express';
import { protect } from '../../controllers/authController';
import { createPackage, deletePackage, getPackage, getPackages, updatePackage } from '../../controllers/miniapps/packageController';

const router = Router();

router.route('/')
.get(protect, getPackages)
.post(protect, createPackage);

router.route('/:id')
.get(protect, getPackage)
.patch(protect, updatePackage)
.delete(protect, deletePackage);

export default router;
