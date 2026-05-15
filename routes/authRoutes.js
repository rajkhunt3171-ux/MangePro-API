import express from 'express';
import { loginUser } from '../controllers/authController.js';
import {createAdminUser, getAdminUser} from '../controllers/createAdminUser.js';
import authMiddleware from '../middleware/authMiddleware.js';
import profile from '../controllers/getUserDetails.js';

const router = express.Router();

// Register
router.post('/create-admin-user', createAdminUser);

//login route
router.post('/login', loginUser);

//get user details route (for testing)
router.get('/user-info', authMiddleware, profile)

//get user 
router.get('/adminuser', getAdminUser)

export default router;