import express from 'express';
import doctorManagementController from '../controllers/Department/coreDepartment/doctorManagement.js';
import patientManagementController from '../controllers/Department/medicalDepartment/patientManagement.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/dm/reset-pwd', authMiddleware, doctorManagementController.resetDoctorPassword)
router.get('/dm/get-dm', authMiddleware, doctorManagementController.getDoctorList);
router.post('/dm/create-dm', authMiddleware, doctorManagementController.coreDepartment);

// leave add for doctor
router.post('/dm/add-leave', doctorManagementController.addDoctorLeave);
router.post('/dm/delete-leave', doctorManagementController.deleteDoctorLeave);

//admit patient
router.post('/ipd/admit-patient', patientManagementController.admitPatient);

export default router;
