import userModel from "../../../models/adminUser.js";
import bedManagementModel from "../../../models/Department/bed/bedManagement.js";
import roomManagementModel from "../../../models/Department/room/roomManagement.js";
import wardManagementModel from "../../../models/Department/ward/wardManagement.js";
import generateUniqueId from "../../../utils/generateId.js";

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== "";

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// helper function
const checkAdminPermission = async (req, res) => {
    const userInfo = await userModel.findOne({ id: req.user?.user_id }).select("id isAdmin -_id");

    if (!userInfo?.isAdmin) {
        res.status(404).json({
            code: 1,
            success: false,
            message: "Not perform this operation"
        });
        return false;
    }

    return true;
};

// create bed
const createBed = async (req, res) => {
    try {
        const hasAdminPermission = await checkAdminPermission(req, res);
        if (!hasAdminPermission) {
            return;
        }

        const { wardId, roomId, name } = req.body;

        if (!hasValue(wardId)) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Ward id is required"
            });
        }

        if (!hasValue(roomId)) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Room id is required"
            });
        }

        if (!hasValue(name)) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Bed name is required"
            });
        }

        const trimmedWardId = String(wardId).trim();
        const trimmedRoomId = String(roomId).trim();
        const bedName = String(name).trim();

        const ward = await wardManagementModel.findOne({ id: trimmedWardId });
        if (!ward) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: "Ward not found"
            });
        }

        const room = await roomManagementModel.findOne({
            id: trimmedRoomId,
            wardId: trimmedWardId
        });

        if (!room) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: "Room not found in this ward"
            });
        }

        const existingBed = await bedManagementModel.findOne({
            roomId: trimmedRoomId,
            name: { $regex: `^${escapeRegex(bedName)}$`, $options: "i" }
        });

        if (existingBed) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Bed already exists"
            });
        }

        const bedId = await generateUniqueId(
            bedManagementModel,
            "id",
            "BED"
        );

        const bed = await bedManagementModel.create({
            id: bedId,
            wardId: trimmedWardId,
            roomId: trimmedRoomId,
            name: bedName
        });

        res.status(201).json({
            code: 0,
            success: true,
            message: "Bed created successfully",
            data: bed
        });
    } catch (error) {
        res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};

// get bed list
const getBedList = async (req, res) => {
    try {
        const { wardId, roomId } = req.query;
        const filter = {};

        if (hasValue(wardId)) {
            filter.wardId = String(wardId).trim();
        }

        if (hasValue(roomId)) {
            filter.roomId = String(roomId).trim();
        }

        const bedList = await bedManagementModel.find(filter).sort({ createdAt: -1 });

        res.status(200).json({
            code: 0,
            success: true,
            bedList
        });
    } catch (error) {
        res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};

// delete bed
const deleteBed = async (req, res) => {
    try {
        const hasAdminPermission = await checkAdminPermission(req, res);
        if (!hasAdminPermission) {
            return;
        }

        const { bedId } = req.params;

        if (!hasValue(bedId)) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Bed id is required"
            });
        }

        const deletedBed = await bedManagementModel.findOneAndDelete({
            id: String(bedId).trim()
        });

        if (!deletedBed) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: "Bed not found"
            });
        }

        res.status(200).json({
            code: 0,
            success: true,
            message: "Bed deleted successfully"
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
    createBed,
    getBedList,
    deleteBed
};
