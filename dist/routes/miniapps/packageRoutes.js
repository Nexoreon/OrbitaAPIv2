"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../../controllers/authController");
const packageController_1 = require("../../controllers/miniapps/packageController");
const router = (0, express_1.Router)();
router.route('/')
    .get(authController_1.protect, packageController_1.getPackages)
    .post(authController_1.protect, packageController_1.createPackage);
router.route('/:id')
    .get(authController_1.protect, packageController_1.getPackage)
    .patch(authController_1.protect, packageController_1.updatePackage)
    .delete(authController_1.protect, packageController_1.deletePackage);
exports.default = router;
