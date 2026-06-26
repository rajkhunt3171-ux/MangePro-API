import express from 'express';
import patientManagementController from '../controllers/Department/medicalDepartment/patientManagement.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// patient management
router.post('/opd/add-patient', authMiddleware, patientManagementController.createPatient);
router.get('/opd/get-patient-list', authMiddleware, patientManagementController.getPatientList);
router.post('/request-to-appointment', authMiddleware, patientManagementController.requestToAppointment);
router.post('/opd/request-to-appointment', authMiddleware, patientManagementController.requestToAppointment);
router.put('/opd/update-patient/:patientId', authMiddleware, patientManagementController.updatePatientDetails);
router.get('/opd/delete-patient/:patientId', authMiddleware, patientManagementController.deletePatient);
router.post('/opd/change-patient-status', patientManagementController.changePatientStatus);


//patient management for doctor
router.get('/opd/get-doctor-patient-list', authMiddleware, patientManagementController.getPatientListForDoctor);
//appointment request list
router.get('/request-to-appointment-list', authMiddleware, patientManagementController.getRequestToAppointmentList);
//appointment request patient details
router.get('/get-patient-details-for-appointment/:patientId', authMiddleware, patientManagementController.getPatientDetailsForAppointment);
//add patient visit details
router.post('/add-patient-visit-details', authMiddleware, patientManagementController.addPatientVisitDetails);
//approve and reject appointment request
router.get('/approve-appointment-request/:appointmentId', authMiddleware, patientManagementController.approveAppointmentRequest);
//payment status and flow set
router.post('/set-payment-status', authMiddleware, patientManagementController.setPaymentStatus);
//transaction list
router.get('/get-transaction-list', authMiddleware, patientManagementController.getTransactionList);


export default router;
