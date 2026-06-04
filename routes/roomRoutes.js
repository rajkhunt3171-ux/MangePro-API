import express from 'express';
import roomManagementController from '../controllers/Department/room/roomManagement.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// room management
router.get('/get-room-list', authMiddleware, roomManagementController.getRoomList);
router.post('/create-room', authMiddleware, roomManagementController.createRoom);
router.get('/delete-room/:roomId', authMiddleware, roomManagementController.deleteRoom);

export default router;
