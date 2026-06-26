import userModel from "../../../models/adminUser.js";
import Appointment from "../../../models/Department/medicalDepartment/appointment.js";
import DrDepartmentModel from "../../../models/Department/coreDepartment/doctorManagement.js";
import PatientManagementModel from "../../../models/Department/medicalDepartment/patientManagement.js";
import TransactionModel from "../../../models/transaction/transaction.js";
import generateUniqueId from "../../../utils/generateId.js";
import mongoose from "mongoose";
import {
    getLatestVisitData,
    hasValue,
    normalizeCharge,
    normalizeVisitDataArray
} from "../../../utils/patientVisitData.js";

const normalizePatientVisitData = (patient) => patient
    ? {
        ...patient,
        visitData: normalizeVisitDataArray(patient)
    }
    : patient;

const toPlainObject = (value) => {
    if (!value) {
        return {};
    }

    if (typeof value.toObject === "function") {
        return value.toObject();
    }

    return value;
};

const normalizePositiveInteger = (value, defaultValue, maxValue) => {
    if (!hasValue(value)) {
        return defaultValue;
    }

    const numberValue = Number(value);

    if (!Number.isInteger(numberValue) || numberValue < 1) {
        return null;
    }

    return Math.min(numberValue, maxValue);
};

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

        const patientList = (await PatientManagementModel.find().sort({ createdAt: -1 }).lean())
            .map(normalizePatientVisitData);
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
            "bedId",
            "charge"
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
                latestVisit[field] = field === "charge" ? normalizeCharge(value) : value;
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

        const patientList = (await PatientManagementModel.find({
            $or: [
                { "visitData.cdId": doctorId },
                { cdId: doctorId }
            ]
        }).sort({ createdAt: -1 }).lean()).map(normalizePatientVisitData);
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
            data: normalizePatientVisitData(patient)
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
            bedId,
            charge
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
            bedId,
            charge: normalizeCharge(charge)
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

//set payment status
const setPaymentStatus = async (req, res) => {
    try {
        const {
            patientId,
            cdId,
            visitId,
            charge
        } = req.body;

        if (!hasValue(patientId)) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Patient id is required"
            });
        }

        const fileCharge = toPlainObject(charge?.fileCharge);
        const paymentCharge = Number(fileCharge.charge);

        if (!hasValue(fileCharge.charge) || Number.isNaN(paymentCharge) || paymentCharge < 0) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Please provide valid file charge"
            });
        }

        if (!hasValue(fileCharge.type)) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Payment type is required"
            });
        }

        if (!hasValue(fileCharge.status)) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Payment status is required"
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

        const latestVisit = getLatestVisitData(patient);
        const latestVisitCdId = hasValue(latestVisit.cdId) ? String(latestVisit.cdId).trim() : "";
        const selectedCdId = hasValue(cdId) ? String(cdId).trim() : latestVisitCdId;

        if (!hasValue(selectedCdId)) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Doctor id is required"
            });
        }

        if (hasValue(latestVisitCdId) && latestVisitCdId !== selectedCdId) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Doctor id does not match latest visit"
            });
        }

        const doctor = await DrDepartmentModel.findOne({ id: selectedCdId })
            .select("id name commission -_id")
            .lean();

        if (!doctor) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: "Doctor not found"
            });
        }

        const adminUser = await userModel.findOne({ id: "USR533808" })
            .select("id -_id")
            .lean();

        if (!adminUser) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: "Admin user not found"
            });
        }

        const currentCharge = toPlainObject(latestVisit.charge);
        const currentFileCharge = toPlainObject(currentCharge.fileCharge);

        const doctorCommission = Number(doctor.commission || 0);
        const commissionAmount = (paymentCharge * doctorCommission) / 100;
        const remainingAmount = paymentCharge - commissionAmount;
        const walletTime = new Date();
        const transactionId = await generateUniqueId(
            TransactionModel,
            "transactionId",
            "TRN"
        );

        const adminWalletEntry = {
            transactionId,
            patientId: selectedPatientId,
            drId: selectedCdId,
            charge: paymentCharge,
            balance: remainingAmount,
            time: walletTime
        };
        const doctorWalletEntry = {
            transactionId,
            patientId: selectedPatientId,
            drId: selectedCdId,
            charge: paymentCharge,
            balance: commissionAmount,
            time: walletTime
        };
        const transactionData = {
            transactionId,
            patientId: selectedPatientId,
            visitId: hasValue(visitId) ? String(visitId).trim() : latestVisit.visitId,
            drId: selectedCdId,
            adminUserId: adminUser.id,
            charge: paymentCharge,
            paymentType: String(fileCharge.type).trim(),
            paymentStatus: String(fileCharge.status).trim(),
            doctorCommission,
            commissionAmount,
            balance: remainingAmount,
            time: walletTime
        };

        latestVisit.charge = normalizeCharge({
            ...currentCharge,
            fileCharge: {
                ...currentFileCharge,
                transactionId,
                charge: paymentCharge,
                type: String(fileCharge.type).trim(),
                status: String(fileCharge.status).trim()
            }
        });

        await Promise.all([
            patient.save(),
            userModel.findOneAndUpdate(
                { id: "USR533808" },
                { $push: { walletList: adminWalletEntry } },
                { new: true, runValidators: true }
            ),
            DrDepartmentModel.findOneAndUpdate(
                { id: selectedCdId },
                { $push: { walletList: doctorWalletEntry } },
                { new: true, runValidators: true }
            ),
            TransactionModel.create(transactionData)
        ]);

        res.status(200).json({
            code: 0,
            success: true,
            message: "Payment status updated successfully",
        });
    } catch (error) {
        res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};

// get transaction list
const getTransactionList = async (req, res) => {
    try {
        const {
            transactionId,
            patientId,
            visitId,
            drId,
            adminUserId,
            paymentType,
            paymentStatus,
            fromDate,
            toDate
        } = req.query;
        const page = normalizePositiveInteger(req.query.page, 1, Number.MAX_SAFE_INTEGER);
        const limit = normalizePositiveInteger(req.query.limit, 20, 100);

        if (page === null || limit === null) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Please provide valid page and limit"
            });
        }

        const filter = {};
        const exactFilters = {
            transactionId,
            patientId,
            visitId,
            drId,
            adminUserId,
            paymentType,
            paymentStatus
        };

        Object.entries(exactFilters).forEach(([field, value]) => {
            if (hasValue(value)) {
                filter[field] = String(value).trim();
            }
        });

        if (hasValue(fromDate) || hasValue(toDate)) {
            filter.time = {};

            if (hasValue(fromDate)) {
                const startDate = new Date(String(fromDate).trim());

                if (Number.isNaN(startDate.getTime())) {
                    return res.status(400).json({
                        code: 1,
                        success: false,
                        message: "Please provide valid fromDate"
                    });
                }

                filter.time.$gte = startDate;
            }

            if (hasValue(toDate)) {
                const endDate = new Date(String(toDate).trim());

                if (Number.isNaN(endDate.getTime())) {
                    return res.status(400).json({
                        code: 1,
                        success: false,
                        message: "Please provide valid toDate"
                    });
                }

                endDate.setHours(23, 59, 59, 999);
                filter.time.$lte = endDate;
            }
        }

        const userId = hasValue(req.user?.user_id) ? String(req.user.user_id).trim() : "";

        if (!hasValue(userId)) {
            return res.status(401).json({
                code: 1,
                success: false,
                message: "User id not found"
            });
        }

        const userInfo = await userModel.findOne({ id: userId }).select("id isAdmin -_id").lean();

        if (!userInfo?.isAdmin) {
            filter.$or = [
                { drId: userId },
                { adminUserId: userId }
            ];
        }

        const skip = (page - 1) * limit;
        const [transactionList, total] = await Promise.all([
            TransactionModel.find(filter)
                .sort({ time: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            TransactionModel.countDocuments(filter)
        ]);

        res.status(200).json({
            code: 0,
            success: true,
            transactionList,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
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
    approveAppointmentRequest,
    setPaymentStatus,
    getTransactionList
};
