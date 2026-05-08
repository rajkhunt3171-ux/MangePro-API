import express from 'express';
import { loginUser } from '../controllers/authController.js';
import createAdminUser from '../controllers/createAdminUser.js';
import authMiddleware from '../middleware/authMiddleware.js';
import profile from '../controllers/getUserDetails.js';

const router = express.Router();

// Register
router.post('/create-admin-user', createAdminUser);

//login route
router.post('/login', loginUser);

//get user details route (for testing)
router.get('/user-info', authMiddleware, profile)

export default router;