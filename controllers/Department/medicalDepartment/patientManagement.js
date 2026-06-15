import userModel from "../../../models/adminUser.js";
import Appointment from "../../../models/Department/medicalDepartment/appointment.js";
import PatientManagementModel from "../../../models/Department/medicalDepartment/patientManagement.js";
import generateUniqueId from "../../../utils/generateId.js";
import mongoose from "mongoose";
import {
    getLatestVisitData,
    hasValue
} from "../../../utils/patientVisitData.js";

// helper function 
const checkAdminPermission = async (req, res) => {
    const userInfo = await userModel.findOne({ id: req.user?.user_id }).select('id isAdmin -_id');

    if (!userInfo?.isAdmin) {
        res.status(404).json({
            code: 1,
            success: false,
            message: 'Not perform this operation'
        });
        return false;
    }

    return true;
};

//create patient
const createPatient = async (req, res) => {
    try {
        const isAdmin = await checkAdminPermission(req, res);
        if (!isAdmin) {
            return;
        }

        const {
            name,
            number,
            age,
            gender,
            dob,
            bloodGroup,
            address,
            emergencyContactName,
            emergencyContactRelation,
            emergencyContactNumber,
            isNewPatient
        } = req.body;

        const patientAge = Number(age);

        if (
            !hasValue(name) ||
            !hasValue(number) ||
            !hasValue(age) ||
            Number.isNaN(patientAge) ||
            patientAge < 0 ||
            !hasValue(gender)
        ) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Please provide all required fields"
            });
        }

        const patientId = await generateUniqueId(
            PatientManagementModel,
            "patientId",
            "PAT"
        );

        const patient = await PatientManagementModel.create({
            patientId,
            name,
            number,
            age: patientAge,
            gender,
            dob,
            bloodGroup,
            address,
            visitData: [],
            emergencyContactName,
            emergencyContactRelation,
            emergencyContactNumber
        });

        res.status(201).json({
            code: 0,
            success: true,
            message: "Patient created successfully",
            data: patient
        });
    } catch (error) {
        res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};

// get patient list
const getPatientList = async (req, res) => {
    try {
        const isAdmin = await checkAdminPermission(req, res);
        if (!isAdmin) {
            return;
        }

        const patientList = await PatientManagementModel.find().sort({ createdAt: -1 }).lean();
        res.status(200).json({
            code: 0,
            success: true,
            patientList
        });
    } catch (error) {
        res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};

// update patient details
const updatePatientDetails = async (req, res) => {
    try {
        const isAdmin = await checkAdminPermission(req, res);
        if (!isAdmin) {
            return;
        }

        const { patientId } = req.params;

        if (!patientId) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Patient id is required"
            });
        }

        const patientFields = [
            "name",
            "number",
            "age",
            "gender",
            "dob",
            "bloodGroup",
            "address",
            "emergencyContactName",
            "emergencyContactRelation",
            "emergencyContactNumber"
        ];

        const visitFields = [
            "visitDate",
            "visitTime",
            "cdId",
            "department",
            "priority",
            "status",
            "symptoms",
            "allergies",
            "idAdmitted",
            "admissionDate",
            "idDischarge",
            "dischargeDate",
            "bedId"
        ];

        const updateData = {};
        const visitUpdateData = {};

        patientFields.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updateData[field] = req.body[field];
            }
        });

        visitFields.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                visitUpdateData[field] = req.body[field];
            }
        });

        if (Object.prototype.hasOwnProperty.call(updateData, "age")) {
            const patientAge = Number(updateData.age);

            if (String(updateData.age).trim() === "" || Number.isNaN(patientAge) || patientAge < 0) {
                return res.status(400).json({
                    code: 1,
                    success: false,
                    message: "Please provide valid age"
                });
            }

            updateData.age = patientAge;
        }

        if (!Object.keys(updateData).length && !Object.keys(visitUpdateData).length) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Please provide patient details to update"
            });
        }

        const patient = await PatientManagementModel.findOne({ patientId });

        if (!patient) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: "Patient not found"
            });
        }

        Object.entries(updateData).forEach(([field, value]) => {
            patient[field] = value;
        });

        if (Object.keys(visitUpdateData).length) {
            const latestVisit = getLatestVisitData(patient);

            Object.entries(visitUpdateData).forEach(([field, value]) => {
                latestVisit[field] = value;
            });
        }

        const updatedPatient = await patient.save();

        res.status(200).json({
            code: 0,
            success: true,
            message: "Patient updated successfully",
            data: updatedPatient
        });
    } catch (error) {
        res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};

// change patient status
const changePatientStatus = async (req, res) => {
    try {
        const { patientId, status } = req.body;

        if (!patientId) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Patient id is required"
            });
        }

        if (status === undefined || status === null || String(status).trim() === "") {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Status is required"
            });
        }

        const patient = await PatientManagementModel.findOne({ patientId });

        if (!patient) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: "Patient not found"
            });
        }

        const latestVisit = getLatestVisitData(patient);
        latestVisit.status = String(status).trim();

        const updatedPatient = await patient.save();

        res.status(200).json({
            code: 0,
            success: true,
            message: "Patient status changed successfully",
            data: updatedPatient
        });
    } catch (error) {
        res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};

// admit patient
const admitPatient = async (req, res) => {
    try {
        const { patientId, idAdmitted, admissionDate } = req.body;

        if (!patientId) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Patient id is required"
            });
        }

        if (idAdmitted === undefined || idAdmitted === null) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Admitted status is required"
            });
        }

        if (admissionDate === undefined || admissionDate === null || String(admissionDate).trim() === "") {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Admission date is required"
            });
        }

        let admittedStatus = idAdmitted;

        if (typeof idAdmitted === "string") {
            const normalizedStatus = idAdmitted.trim().toLowerCase();

            if (normalizedStatus === "true") {
                admittedStatus = true;
            } else if (normalizedStatus === "false") {
                admittedStatus = false;
            }
        }

        if (typeof admittedStatus !== "boolean") {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Please provide valid admitted status"
            });
        }

        const patient = await PatientManagementModel.findOne({ patientId });

        if (!patient) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: "Patient not found"
            });
        }

        const latestVisit = getLatestVisitData(patient);
        latestVisit.idAdmitted = admittedStatus;
        latestVisit.admissionDate = String(admissionDate).trim();

        const updatedPatient = await patient.save();

        res.status(200).json({
            code: 0,
            success: true,
            message: "Patient admitted successfully",
            data: updatedPatient
        });
    } catch (error) {
        res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};

// delete patient
const deletePatient = async (req, res) => {
    try {
        const isAdmin = await checkAdminPermission(req, res);
        if (!isAdmin) {
            return;
        }

        const { patientId } = req.params;

        if (!patientId) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Patient id is required"
            });
        }

        const deletedPatient = await PatientManagementModel.findOneAndDelete({ patientId });

        if (!deletedPatient) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: "Patient not found"
            });
        }

        res.status(200).json({
            code: 0,
            success: true,
            message: "Patient deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};

// get patient list for doctor
const getPatientListForDoctor = async (req, res) => {
    try {
        const doctorId = req.user?.user_id;

        if (!doctorId) {
            return res.status(401).json({
                code: 1,
                success: false,
                message: "Doctor id not found"
            });
        }

        const patientList = await PatientManagementModel.find({
            $or: [
                { "visitData.cdId": doctorId },
                { cdId: doctorId }
            ]
        }).sort({ createdAt: -1 }).lean();
        res.status(200).json({
            code: 0,
            success: true,
            patientList
        });
    } catch (error) {
        res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};

// request to appointment
const requestToAppointment = async (req, res) => {
    try {
        const { patientId } = req.body;

        if (!hasValue(patientId)) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Patient id is required"
            });
        }

        const selectedPatientId = String(patientId).trim();
        const patient = await PatientManagementModel.findOne({ patientId: selectedPatientId }).select("patientId -_id");

        if (!patient) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: "Patient not found"
            });
        }

        const existingAppointment = await Appointment.findOne({ patientId: selectedPatientId });

        if (existingAppointment) {
            const updatedAppointment = await Appointment.findOneAndUpdate(
                { patientId: selectedPatientId },
                {
                    $set: {
                        status: "Requested",
                        updatedAt: new Date()
                    }
                },
                {
                    new: true,
                    runValidators: true
                }
            );
            const appointmentData = updatedAppointment.toObject();

            return res.status(200).json({
                code: 0,
                success: true,
                message: "Appointment updated successfully",
                data: appointmentData
            });
        }

        const appointmentId = await generateUniqueId(
            Appointment,
            "appointmentId",
            "APT"
        );

        const appointment = await Appointment.create({
            appointmentId,
            patientId: selectedPatientId
        });
        const appointmentData = appointment.toObject();

        res.status(201).json({
            code: 0,
            success: true,
            message: "Appointment requested successfully",
            data: appointmentData
        });
    } catch (error) {
        res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};

// get request to appointment list
const getRequestToAppointmentList = async (_req, res) => {
    try {
        const appointments = await Appointment.find().sort({ createdAt: -1 }).lean();
        res.status(200).json({
            code: 0,
            success: true,
            data: appointments
        });
    } catch (error) {
        res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};

//appointment request patient details
const getPatientDetailsForAppointment = async (req, res) => {
    try {
        const patientId = req.params.patientId;
        const patient = await PatientManagementModel.findOne({ patientId }).lean();
        res.status(200).json({
            code: 0,
            success: true,
            data: patient
        });
    } catch (error) {
        res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};

//add patient visit details
const addPatientVisitDetails = async (req, res) => {
    try {
        const {
            patientId,
            visitDate,
            visitTime,
            cdId,
            department,
            priority,
            status,
            symptoms,
            allergies,
            idAdmitted,
            admissionDate,
            idDischarge,
            dischargeDate,
            bedId
        } = req.body;

        if (!hasValue(patientId)) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Patient id is required"
            });
        }

        const selectedPatientId = String(patientId).trim();
        const patient = await PatientManagementModel.findOne({ patientId: selectedPatientId });

        if (!patient) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: "Patient not found"
            });
        }

        patient.isNewPatient = !(Array.isArray(patient.visitData) && patient.visitData.length >= 1);

        const visitId = await generateUniqueId(
            PatientManagementModel,
            "visitData.visitId",
            "VIS"
        );

        const visitDetails = {
            visitId,
            patientId: selectedPatientId,
            visitDate,
            visitTime,
            cdId,
            department,
            priority,
            status: hasValue(status) ? status : "Waiting",
            symptoms,
            allergies,
            idAdmitted,
            admissionDate,
            idDischarge,
            dischargeDate,
            bedId
        };

        patient.visitData.unshift(visitDetails);
        const updatedPatient = await patient.save();

        res.status(200).json({
            code: 0,
            success: true,
            message: "Patient visit added successfully",
            data: updatedPatient
        });
    } catch (error) {
        res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};

//approve and reject appointment request
const approveAppointmentRequest = async (req, res) => {
    try {
        const appointmentId = req.params.appointmentId;

        if (!hasValue(appointmentId)) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Appointment id is required"
            });
        }

        const selectedAppointmentId = String(appointmentId).trim();
        const appointmentFilter = mongoose.Types.ObjectId.isValid(selectedAppointmentId)
            ? {
                $or: [
                    { _id: selectedAppointmentId },
                    { appointmentId: selectedAppointmentId }
                ]
            }
            : { appointmentId: selectedAppointmentId };

        const appointment = await Appointment.findOneAndDelete(appointmentFilter);

        if (!appointment) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: "Appointment not found"
            });
        }

        res.status(200).json({
            code: 0,
            success: true,
            message: "Appointment request approve successfully"
        });
    } catch (error) {
        res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};

export default {
    createPatient,
    getPatientList,
    requestToAppointment,
    getRequestToAppointmentList,
    updatePatientDetails,
    changePatientStatus,
    admitPatient,
    deletePatient,
    getPatientListForDoctor,
    getPatientDetailsForAppointment,
    addPatientVisitDetails,
    approveAppointmentRequest
};
