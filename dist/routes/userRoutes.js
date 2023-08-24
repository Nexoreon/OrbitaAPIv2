"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const userController_1 = require("../controllers/userController");
const router = express_1.default.Router();
router.route('/')
    .get(authController_1.protect, userController_1.getUsers);
router.route('/me')
    .get(authController_1.protect, userController_1.getMyProfile);
router.route('/getUserProgress')
    .get(authController_1.protect, userController_1.getUserProgress);
router.post('/signup', authController_1.signup);
router.post('/login', authController_1.login);
router.post('/forgotPassword', authController_1.forgotPassword);
router.patch('/updateMyPassword', authController_1.protect, authController_1.updatePasswords);
router.patch('/updateMe', authController_1.protect, userController_1.uploadUserPhoto, userController_1.resizeUserPhoto, userController_1.updateMe);
router.delete('/deleteMe', authController_1.protect, userController_1.deleteMe);
router.patch('/resetPassword/:token', authController_1.resetPassword);
router.get('/:id', authController_1.protect, userController_1.getUser);
exports.default = router;
