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

const leaveTypes = ["full_day", "half_day", "emergency", "weekly_off"];

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== "";

const createBadRequestError = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
};

const getNextLeaveId = (leave = []) => {
    const lastLeaveId = leave.reduce((maxId, leaveItem) => {
        const leaveId = Number(leaveItem.leave_id);
        return Number.isInteger(leaveId) && leaveId > maxId ? leaveId : maxId;
    }, 0);

    return lastLeaveId + 1;
};

const normalizeLeave = (leaveItem, fallbackLeaveId) => {
    if (!leaveItem || typeof leaveItem !== "object" || Array.isArray(leaveItem)) {
        throw createBadRequestError("Please provide valid leave details");
    }

    const leaveId = Number(leaveItem.leave_id ?? fallbackLeaveId);

    if (!Number.isInteger(leaveId) || leaveId <= 0) {
        throw createBadRequestError("Please provide valid leave id");
    }

    if (!hasValue(leaveItem.leave_type) || !leaveTypes.includes(String(leaveItem.leave_type).trim())) {
        throw createBadRequestError("Please provide valid leave type");
    }

    if (!hasValue(leaveItem.from_date) || !hasValue(leaveItem.to_date)) {
        throw createBadRequestError("Please provide leave from date and to date");
    }

    return {
        leave_id: leaveId,
        leave_type: String(leaveItem.leave_type).trim(),
        from_date: String(leaveItem.from_date).trim(),
        to_date: String(leaveItem.to_date).trim(),
        from_time: hasValue(leaveItem.from_time) ? String(leaveItem.from_time).trim() : null,
        to_time: hasValue(leaveItem.to_time) ? String(leaveItem.to_time).trim() : null,
        reason: hasValue(leaveItem.reason) ? String(leaveItem.reason).trim() : "",
        note: hasValue(leaveItem.note) ? String(leaveItem.note).trim() : "",
        is_available: typeof leaveItem.is_available === "boolean" ? leaveItem.is_available : false,
        created_at: hasValue(leaveItem.created_at) ? String(leaveItem.created_at).trim() : new Date().toISOString()
    };
};

const normalizeLeaveList = (leave, startLeaveId = 1, existingLeaveIds = new Set()) => {
    if (leave === undefined || leave === null) {
        return [];
    }

    const leaveList = Array.isArray(leave) ? leave : [leave];

    return leaveList.map((leaveItem, index) => {
        const normalizedLeave = normalizeLeave(leaveItem, startLeaveId + index);

        if (existingLeaveIds.has(normalizedLeave.leave_id)) {
            throw createBadRequestError("Leave id already exists");
        }

        existingLeaveIds.add(normalizedLeave.leave_id);
        return normalizedLeave;
    });
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
            weeklyOff,
            leave
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

        const leaveList = normalizeLeaveList(leave);

        if (leaveList.length) {
            doctorData.leave = leaveList;
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
        res.status(error.statusCode || 500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }

};

const addDoctorLeave = async (req, res) => {
    try {
        const hasAdminPermission = await checkAdminPermission(req, res);
        if (!hasAdminPermission) return;

        const doctorId = req.params.id || req.body.id || req.body.doctorId;

        if (!doctorId) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Doctor id is required"
            });
        }

        const doctor = await DrDepartmentModel.findOne({ id: doctorId });

        if (!doctor) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: "Doctor not found"
            });
        }

        const leaveInput = Object.prototype.hasOwnProperty.call(req.body, "leave")
            ? req.body.leave
            : req.body;

        const existingLeaveIds = new Set((doctor.leave || []).map((leaveItem) => Number(leaveItem.leave_id)));
        const leaveList = normalizeLeaveList(leaveInput, getNextLeaveId(doctor.leave), existingLeaveIds);

        if (!leaveList.length) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Please provide leave details"
            });
        }

        doctor.leave.push(...leaveList);
        await doctor.save();

        res.status(200).json({
            code: 0,
            success: true,
            message: "Doctor leave added successfully",
            data: doctor
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};

export default {
    coreDepartment,
    getDoctorList,
    resetDoctorPassword,
    addDoctorLeave
};
