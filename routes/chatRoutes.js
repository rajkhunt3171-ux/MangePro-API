import express from 'express';
import {
    createConversation,
    getMessages,
    getUserConversations
} from '../controllers/chat.js';

const router = express.Router();

router.post('/conversation', createConversation);
router.get('/messages/:conversationId', getMessages);
router.get('/conversations/:userId', getUserConversations);

export default router;
