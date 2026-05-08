import express from 'express';
import coreDepartment from '../controllers/Department/coreDepartment/doctorManagement.js';
import authMiddleware from '../middleware/authMiddleware.js';


const router = express.Router();

router.post('/dm/create-dm', authMiddleware, coreDepartment);

export default router;