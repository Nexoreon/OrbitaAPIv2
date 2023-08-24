import express from 'express';
import { protect, signup, login, forgotPassword, resetPassword, updatePasswords } from '../controllers/authController';
import { getUsers, getUser, getMyProfile, updateMe, deleteMe, getUserProgress, uploadUserPhoto, resizeUserPhoto } from '../controllers/userController';

const router = express.Router();

router.route('/')
.get(protect, getUsers);

router.route('/me')
.get(protect, getMyProfile);

router.route('/getUserProgress')
.get(protect, getUserProgress);

router.post('/signup', signup);
router.post('/login', login);

router.post('/forgotPassword', forgotPassword);
router.patch('/updateMyPassword', protect, updatePasswords);

router.patch('/updateMe', protect, uploadUserPhoto, resizeUserPhoto, updateMe);
router.delete('/deleteMe', protect, deleteMe);
router.patch('/resetPassword/:token', resetPassword);
router.get('/:id', protect, getUser);

export default router;
