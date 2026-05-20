import userModel from '../../../models/adminUser.js';
import DrDepartmentModel from '../../../models/Department/coreDepartment/doctorManagement.js';
import generateUniqueId from '../../../utils/generateId.js';
import { encrypt } from '../../../utils/encryptionDecryption.js';

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

//reset password flow
const resetDoctorPassword = async (req, res) => {
    try {
        const { id, password } = req.body;

        const hasAdminPermission = await checkAdminPermission(req, res);
        if (!hasAdminPermission) return;

        if (!id || !password) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Doctor id and password are required"
            });
        }

        const doctor = await DrDepartmentModel.findOne({ id });

        if (!doctor) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: "No user found"
            });
        }

        doctor.password = encrypt(String(password));
        await doctor.save();

        res.status(200).json({
            code: 0,
            success: true,
            message: "Doctor password reset successfully"
        });
    } catch (error) {
        res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
}

const getDoctorList = async (req, res) => {

    try {
        const doctorList = await DrDepartmentModel.find();
        res.status(200).json({
            code: 0,
            success: true,
            doctorList
        });
    } catch (error) {
        res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
}

const coreDepartment = async (req, res) => {
    try {
        const hasAdminPermission = await checkAdminPermission(req, res);
        if (!hasAdminPermission) return;

        const {
            name,
            specification,
            qualification,
            experience,
            contactDetails,
            commission = 0,
            profileImage,
            type,
            shiftStartTime,
            shiftEndTime,
            status,
            weeklyOff
        } = req.body;

        // Validation
        if (!name || !specification || !qualification || !experience || !contactDetails?.phone || !commission || !type) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Please provide all required fields"
            });
        }

        const doctor_id = await generateUniqueId(
            DrDepartmentModel,
            "id",
            "DR"
        );

        const doctorData = {
            id: doctor_id,
            name,
            specification,
            qualification,
            experience,
            contactDetails,
            commission,
            profileImage,
            type,
            shiftStartTime: shiftStartTime || "09:00",
            shiftEndTime: shiftEndTime || "17:00",
            status: status || "Active"
        }

        if (type === 1) {
            doctorData.weeklyOff = weeklyOff || ["Sunday"];
        }

        const newDoctor = await DrDepartmentModel.create(doctorData);

        res.status(201).json({
            code: 0,
            success: true,
            message: "Doctor created successfully",
            data: newDoctor
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
    coreDepartment,
    getDoctorList,
    resetDoctorPassword
};
