import express from 'express';
import bedManagementController from '../controllers/Department/bed/bedManagement.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// bed management
router.get('/get-bed-list', authMiddleware, bedManagementController.getBedList);
router.post('/create-bed', authMiddleware, bedManagementController.createBed);
router.post('/change-bed-status', authMiddleware, bedManagementController.changeBedStatus);
router.get('/delete-bed/:bedId', authMiddleware, bedManagementController.deleteBed);
router.post('/assign-patient-to-bed', authMiddleware, bedManagementController.assignPatientToBed);

export default router;
