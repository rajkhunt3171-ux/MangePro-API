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

        const patientList = await PatientManagementModel.find().sort({ createdAt: -1 }).lean();
        const patientListWithStatus = patientList.map((patient) => ({
            ...patient,
            status: patient.status || "Waiting"
        }));

        res.status(200).json({
            code: 0,
            success: true,
            patientList: patientListWithStatus
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

        const allowedFields = [
            "name",
            "number",
            "age",
            "gender",
            "dob",
            "bloodGroup",
            "address",
            "visitDate",
            "visitTime",
            "cdId",
            "department",
            "priority",
            "status",
            "symptoms",
            "allergies",
            "currentMedication",
            "emergencyContactName",
            "emergencyContactRelation",
            "emergencyContactNumber"
        ];

        const updateData = {};

        allowedFields.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updateData[field] = req.body[field];
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

        if (!Object.keys(updateData).length) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Please provide patient details to update"
            });
        }

        const updatedPatient = await PatientManagementModel.findOneAndUpdate(
            { patientId },
            { $set: updateData },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedPatient) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: "Patient not found"
            });
        }

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
        const isAdmin = await checkAdminPermission(req, res);
        if (!isAdmin) {
            return;
        }

        const { patientId } = req.params;
        const { status } = req.body;

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

        const updatedPatient = await PatientManagementModel.findOneAndUpdate(
            { patientId },
            { $set: { status: String(status).trim() } },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedPatient) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: "Patient not found"
            });
        }

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

        const patientList = await PatientManagementModel.find({ cdId: doctorId }).sort({ createdAt: -1 }).lean();
        const patientListWithStatus = patientList.map((patient) => ({
            ...patient,
            status: patient.status || "Waiting"
        }));

        res.status(200).json({
            code: 0,
            success: true,
            patientList: patientListWithStatus
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
    updatePatientDetails,
    changePatientStatus,
    deletePatient,
    getPatientListForDoctor
};
