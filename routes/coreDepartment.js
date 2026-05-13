import express from 'express';
import doctorManagementController from '../controllers/Department/coreDepartment/doctorManagement.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dm/get-dm', authMiddleware, doctorManagementController.getDoctorList);
router.post('/dm/create-dm', authMiddleware, doctorManagementController.coreDepartment);

export default router;