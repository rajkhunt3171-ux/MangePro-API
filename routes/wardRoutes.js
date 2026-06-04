import express from 'express';
import wardManagementController from '../controllers/Department/ward/wardManagement.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// ward management
router.get('/get-ward-list', authMiddleware, wardManagementController.getWardList);
router.post('/create-ward', authMiddleware, wardManagementController.createWard);
router.get('/delete-ward/:wardId', authMiddleware, wardManagementController.deleteWard);

export default router;