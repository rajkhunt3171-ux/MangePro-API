import userModel from '../models/adminUser.js';
import departmentModel from '../models/Department/departments.js';
import DrDepartmentModel from '../models/Department/coreDepartment/doctorManagement.js';


const profile = async (req, res) => {
    try {
        const userInfo = await userModel.findOne({ id: req.user.user_id }).select('id username email isAdmin isActive isOnline lastSeen department role walletList -_id');

        if (!userInfo) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: 'User not found'
            });
        }

        const departmentInfo = await departmentModel.findOne({ id: userInfo.department }).select('id name description isActive -_id');

        res.status(200).json({
            code: 0,
            success: true,
            user: userInfo,
            department: departmentInfo
        });
    } catch (error) {
        res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};

const doctorProfile = async (req, res) => {
    try {
        const doctorInfo = await DrDepartmentModel.findOne({ id: req.user.user_id })
            .select('id type name specification qualification experience contactDetails profileImage commission shiftStartTime shiftEndTime weeklyOff leave walletList status createdAt updatedAt -_id');

        if (!doctorInfo) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: 'Doctor not found'
            });
        }

        res.status(200).json({
            code: 0,
            success: true,
            doctor: doctorInfo
        });
    } catch (error) {
        res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};

export { doctorProfile };
export default profile;
