import express from 'express';
import createAdminUser from '../controllers/Department/createDepartment.js';

const router = express.Router();

router.post('/create-department', createAdminUser);

export default router;