import loginUserModel from '../models/login.js';
import userModel from '../models/adminUser.js';
import departmentModel from '../models/Department/departments.js';


const profile = async (req, res) => {
    try {
        const userInfo = await userModel.findOne({ id: req.user.user_id }).select('id username email isAdmin isActive department role -_id');

        const departmentInfo = await departmentModel.findOne({ id: userInfo.department }).select('id name description isActive -_id');

        if (!userInfo) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: 'User not found'
            });
        }
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

export default profile;