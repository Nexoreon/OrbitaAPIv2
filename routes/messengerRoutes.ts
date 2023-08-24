import { Router } from 'express';
import { protect } from '../controllers/authController';
import {
    createConversation,
    deleteConversation,
    deleteMessage,
    editMessage,
    getConversation,
    getConversations,
    getMessage,
    sendMessage,
} from '../controllers/messengerController';

const router = Router();

router.get('/', protect, getConversations);
router.post('/conversations', protect, createConversation);

router.route('/conversations/:convId')
.get(protect, getConversation)
.post(protect, sendMessage)
.delete(protect, deleteConversation);

router.route('/messages/:msgId')
.get(protect, getMessage)
.patch(protect, editMessage)
.delete(protect, deleteMessage);

export default router;
