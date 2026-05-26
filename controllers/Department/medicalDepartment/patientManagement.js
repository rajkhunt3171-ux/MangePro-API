import userModel from "../../../models/adminUser.js";
import PatientManagementModel from "../../../models/Department/medicalDepartment/patientManagement.js";
import generateUniqueId from "../../../utils/generateId.js";

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
            visitDate,
            visitTime,
            cdId,
            department,
            priority,
            symptoms,
            allergies,
            currentMedication,
            emergencyContactName,
            emergencyContactRelation,
            emergencyContactNumber
        } = req.body;

        const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== "";
        const patientAge = Number(age);

        if (
            !hasValue(name) ||
            !hasValue(number) ||
            !hasValue(age) ||
            Number.isNaN(patientAge) ||
            patientAge < 0 ||
            !hasValue(gender) ||
            !hasValue(visitDate) ||
            !hasValue(visitTime) ||
            !hasValue(cdId) ||
            !hasValue(department) ||
            !hasValue(priority)
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
            visitDate,
            visitTime,
            cdId,
            department,
            priority,
            symptoms,
            allergies,
            currentMedication,
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

        const patientList = await PatientManagementModel.find().sort({ createdAt: -1 });

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

export default {
    createPatient,
    getPatientList
};
