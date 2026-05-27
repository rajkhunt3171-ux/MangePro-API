import express from 'express';
import { loginUser, doctorLogin } from '../controllers/authController.js';
import {createAdminUser, getAdminUser} from '../controllers/createAdminUser.js';
import authMiddleware from '../middleware/authMiddleware.js';
import profile, { doctorProfile } from '../controllers/getUserDetails.js';

const router = express.Router();

// Register
router.post('/create-admin-user', createAdminUser);

//login route
router.post('/login', loginUser);

//doctor login route
router.post('/doctor-login', doctorLogin);

//get user details route (for testing)
router.get('/user-info', authMiddleware, profile)

//get doctor profile
router.get('/doctor-profile', authMiddleware, doctorProfile)

//get user 
router.get('/adminuser', getAdminUser)


export default router;
