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
const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== "";

const normalizeDayName = (dayName) => String(dayName).trim().replace(/,+$/, "").toLowerCase();

const createBadRequestError = (message) => {
    const error = new Error(message);
    error.statusCode = 200;
    return error;
};

const getComparableDate = (dateValue) => {
    const date = String(dateValue).trim();
    const timestamp = Date.parse(`${date}T00:00:00.000Z`);
    return Number.isNaN(timestamp) ? null : timestamp;
};

const getLeaveDayNames = (fromDate, toDate) => {
    const fromTimestamp = getComparableDate(fromDate);
    const toTimestamp = getComparableDate(toDate);

    if (fromTimestamp === null || toTimestamp === null) {
        return [];
    }

    const dayNames = new Set();
    const oneDay = 24 * 60 * 60 * 1000;

    for (let timestamp = fromTimestamp; timestamp <= toTimestamp; timestamp += oneDay) {
        dayNames.add(weekDays[new Date(timestamp).getUTCDay()]);
    }

    return [...dayNames];
};

const getComparableTime = (timeValue) => {
    if (!hasValue(timeValue)) {
        return null;
    }

    const timeParts = String(timeValue).trim().split(":").map(Number);
    const [hours, minutes = 0, seconds = 0] = timeParts;

    if (
        timeParts.some((timePart) => Number.isNaN(timePart)) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59 ||
        seconds < 0 ||
        seconds > 59
    ) {
        return null;
    }

    return (hours * 60 * 60) + (minutes * 60) + seconds;
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

    const leaveType = hasValue(leaveItem.leave_type) ? String(leaveItem.leave_type).trim() : "";

    if (!leaveType || !leaveTypes.includes(leaveType)) {
        throw createBadRequestError("Please provide valid leave type");
    }

    if (!hasValue(leaveItem.from_date) || !hasValue(leaveItem.to_date)) {
        throw createBadRequestError("Please provide leave from date and to date");
    }

    const fromDate = String(leaveItem.from_date).trim();
    const toDate = String(leaveItem.to_date).trim();
    const fromTime = hasValue(leaveItem.from_time) ? String(leaveItem.from_time).trim() : null;
    const toTime = hasValue(leaveItem.to_time) ? String(leaveItem.to_time).trim() : null;
    const comparableFromDate = getComparableDate(fromDate);
    const comparableToDate = getComparableDate(toDate);
    const comparableFromTime = getComparableTime(fromTime);
    const comparableToTime = getComparableTime(toTime);

    if (comparableFromDate === null || comparableToDate === null) {
        throw createBadRequestError("Please provide valid leave date");
    }

    if (comparableFromDate > comparableToDate) {
        throw createBadRequestError("Leave from date cannot be after to date");
    }

    if (["half_day", "emergency", "weekly_off"].includes(leaveType)) {
        if (!fromTime || !toTime) {
            throw createBadRequestError("Please provide leave from time and to time");
        }

        if (comparableFromTime === null || comparableToTime === null) {
            throw createBadRequestError("Please provide valid leave time");
        }

        if (comparableFromTime >= comparableToTime) {
            throw createBadRequestError("Leave from time must be before to time");
        }
    }

    return {
        leave_id: leaveId,
        leave_type: leaveType,
        from_date: fromDate,
        to_date: toDate,
        from_time: fromTime,
        to_time: toTime,
        reason: hasValue(leaveItem.reason) ? String(leaveItem.reason).trim() : "",
        note: hasValue(leaveItem.note) ? String(leaveItem.note).trim() : "",
        is_available: typeof leaveItem.is_available === "boolean" ? leaveItem.is_available : false,
        created_at: hasValue(leaveItem.created_at) ? String(leaveItem.created_at).trim() : new Date().toISOString()
    };
};

const areLeaveDatesOverlapping = (firstLeave, secondLeave) => {
    const firstFromDate = getComparableDate(firstLeave.from_date);
    const firstToDate = getComparableDate(firstLeave.to_date);
    const secondFromDate = getComparableDate(secondLeave.from_date);
    const secondToDate = getComparableDate(secondLeave.to_date);

    if (
        firstFromDate !== null &&
        firstToDate !== null &&
        secondFromDate !== null &&
        secondToDate !== null
    ) {
        return firstFromDate <= secondToDate && secondFromDate <= firstToDate;
    }

    const firstDates = [String(firstLeave.from_date).trim(), String(firstLeave.to_date).trim()];
    const secondDates = [String(secondLeave.from_date).trim(), String(secondLeave.to_date).trim()];

    return firstDates.some((date) => secondDates.includes(date));
};

const areLeaveTimesOverlapping = (firstLeave, secondLeave) => {
    const firstFromTime = getComparableTime(firstLeave.from_time);
    const firstToTime = getComparableTime(firstLeave.to_time);
    const secondFromTime = getComparableTime(secondLeave.from_time);
    const secondToTime = getComparableTime(secondLeave.to_time);

    if (
        firstFromTime !== null &&
        firstToTime !== null &&
        secondFromTime !== null &&
        secondToTime !== null
    ) {
        return firstFromTime < secondToTime && secondFromTime < firstToTime;
    }

    return true;
};

const hasDuplicateLeaveDate = (existingLeaves, leaveItem) => existingLeaves.some((existingLeave) => {
    if (!existingLeave) {
        return false;
    }

    const existingLeaveType = String(existingLeave.leave_type || "").trim();

    if (!areLeaveDatesOverlapping(existingLeave, leaveItem)) {
        return false;
    }

    if (existingLeaveType === "full_day" || leaveItem.leave_type === "full_day") {
        return true;
    }

    if (["half_day", "emergency", "weekly_off"].includes(existingLeaveType) && ["half_day", "emergency", "weekly_off"].includes(leaveItem.leave_type)) {
        return areLeaveTimesOverlapping(existingLeave, leaveItem);
    }

    return existingLeaveType === leaveItem.leave_type;
});

const hasWeeklyOffConflict = (weeklyOff = [], leaveItem) => {
    const weeklyOffList = Array.isArray(weeklyOff) ? weeklyOff : [weeklyOff];
    const weeklyOffSet = new Set(
        weeklyOffList
            .filter(hasValue)
            .map((weeklyOffDay) => normalizeDayName(weeklyOffDay))
    );

    if (!weeklyOffSet.size) {
        return false;
    }

    return getLeaveDayNames(leaveItem.from_date, leaveItem.to_date).some((leaveDay) => (
        weeklyOffSet.has(normalizeDayName(leaveDay))
    ));
};

const normalizeLeaveList = (leave, startLeaveId = 1, existingLeaveIds = new Set(), existingLeaves = [], weeklyOff = []) => {
    if (leave === undefined || leave === null) {
        return [];
    }

    const leaveList = Array.isArray(leave) ? leave : [leave];
    const normalizedLeaves = [];

    leaveList.forEach((leaveItem, index) => {
        const normalizedLeave = normalizeLeave(leaveItem, startLeaveId + index);

        if (existingLeaveIds.has(normalizedLeave.leave_id)) {
            throw createBadRequestError("Leave id already exists");
        }

        if (hasDuplicateLeaveDate([...existingLeaves, ...normalizedLeaves], normalizedLeave)) {
            throw createBadRequestError("Leave already exists for selected date and time");
        }

        if (hasWeeklyOffConflict(weeklyOff, normalizedLeave)) {
            throw createBadRequestError("Leave cannot be added on weekly off");
        }

        existingLeaveIds.add(normalizedLeave.leave_id);
        normalizedLeaves.push(normalizedLeave);
    });

    return normalizedLeaves;
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

        const doctorType = Number(type);
        const doctorWeeklyOff = doctorType === 1 ? (weeklyOff || ["Sunday"]) : [];
        const leaveList = normalizeLeaveList(leave, 1, new Set(), [], doctorWeeklyOff);

        if (leaveList.length) {
            doctorData.leave = leaveList;
        }

        if (doctorType === 1) {
            doctorData.weeklyOff = doctorWeeklyOff;
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
        const doctorId = req.params.id || req.body.id || req.body.doctorId;

        if (!doctorId) {
            return res.status(200).json({
                code: 1,
                success: false,
                message: "Doctor id is required"
            });
        }

        const doctor = await DrDepartmentModel.findOne({ id: doctorId });

        if (!doctor) {
            return res.status(200).json({
                code: 1,
                success: false,
                message: "Doctor not found"
            });
        }

        const leaveInput = Object.prototype.hasOwnProperty.call(req.body, "leave")
            ? req.body.leave
            : req.body;

        const existingLeaveIds = new Set((doctor.leave || []).map((leaveItem) => Number(leaveItem.leave_id)));
        const leaveList = normalizeLeaveList(
            leaveInput,
            getNextLeaveId(doctor.leave),
            existingLeaveIds,
            doctor.leave || [],
            doctor.weeklyOff || []
        );

        if (!leaveList.length) {
            return res.status(200).json({
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

const deleteDoctorLeave = async (req, res) => {
    try {
        const { id, doctorId: payloadDoctorId, leave_id, leaveId: payloadLeaveId } = req.body || {};
        const doctorId = id || payloadDoctorId;
        const leaveIdInput = leave_id || payloadLeaveId;
        const leaveId = Number(leaveIdInput);

        if (!doctorId) {
            return res.status(200).json({
                code: 1,
                success: false,
                message: "Doctor id is required"
            });
        }

        if (!Number.isInteger(leaveId) || leaveId <= 0) {
            return res.status(200).json({
                code: 1,
                success: false,
                message: "Please provide valid leave id"
            });
        }

        const doctor = await DrDepartmentModel.findOne({ id: doctorId });

        if (!doctor) {
            return res.status(200).json({
                code: 1,
                success: false,
                message: "Doctor not found"
            });
        }

        const leaveIndex = (doctor.leave || []).findIndex((leaveItem) => Number(leaveItem.leave_id) === leaveId);

        if (leaveIndex === -1) {
            return res.status(200).json({
                code: 1,
                success: false,
                message: "Leave not found"
            });
        }

        doctor.leave.splice(leaveIndex, 1);
        await doctor.save();

        res.status(200).json({
            code: 0,
            success: true,
            message: "Doctor leave deleted successfully",
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
    addDoctorLeave,
    deleteDoctorLeave
};
