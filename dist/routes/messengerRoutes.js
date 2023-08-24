"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const messengerController_1 = require("../controllers/messengerController");
const router = (0, express_1.Router)();
router.get('/', authController_1.protect, messengerController_1.getConversations);
router.post('/conversations', authController_1.protect, messengerController_1.createConversation);
router.route('/conversations/:convId')
    .get(authController_1.protect, messengerController_1.getConversation)
    .post(authController_1.protect, messengerController_1.sendMessage)
    .delete(authController_1.protect, messengerController_1.deleteConversation);
router.route('/messages/:msgId')
    .get(authController_1.protect, messengerController_1.getMessage)
    .patch(authController_1.protect, messengerController_1.editMessage)
    .delete(authController_1.protect, messengerController_1.deleteMessage);
exports.default = router;
