import userModel from '../../../models/adminUser.js';
import DrDepartmentModel from '../../../models/Department/coreDepartment/doctorManagement.js';
import generateUniqueId from '../../../utils/generateId.js';


const coreDepartment = async (req, res) => {
    try {
        const userInfo = await userModel.findOne({ id: req.user.user_id }).select('id isAdmin -_id');

        if (!userInfo.isAdmin) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: 'Not perform this operation'
            });
        }

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

export default coreDepartment;