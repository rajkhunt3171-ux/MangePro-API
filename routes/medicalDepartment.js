import express from 'express';
import patientManagementController from '../controllers/Department/medicalDepartment/patientManagement.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// patient management
router.post('/opd/add-patient', authMiddleware, patientManagementController.createPatient);
router.get('/opd/get-patient-list', authMiddleware, patientManagementController.getPatientList);
router.put('/opd/update-patient/:patientId', authMiddleware, patientManagementController.updatePatientDetails);
router.get('/opd/delete-patient/:patientId', authMiddleware, patientManagementController.deletePatient);

export default router;
