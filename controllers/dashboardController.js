import userModel from "../models/adminUser.js";
import departmentModel from "../models/Department/departments.js";
import DrDepartmentModel from "../models/Department/coreDepartment/doctorManagement.js";
import Appointment from "../models/Department/medicalDepartment/appointment.js";
import PatientManagementModel from "../models/Department/medicalDepartment/patientManagement.js";
import bedManagementModel from "../models/Department/bed/bedManagement.js";
import roomManagementModel from "../models/Department/room/roomManagement.js";
import wardManagementModel from "../models/Department/ward/wardManagement.js";
import TransactionModel from "../models/transaction/transaction.js";


const getDashboardSummary = async (req, res) => {
    try {
        const userInfo = await userModel.findOne({ id: req.user.user_id }).select('id username email isAdmin isActive isOnline lastSeen department role walletList -_id');

        if (!userInfo) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: 'User not found'
            });
        }

    } catch (error) {
        res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};

export default {
    getDashboardSummary
};
