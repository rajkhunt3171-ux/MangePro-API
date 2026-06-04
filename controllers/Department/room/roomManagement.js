import userModel from "../../../models/adminUser.js";
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

// create room
const createRoom = async (req, res) => {
    try {
        const hasAdminPermission = await checkAdminPermission(req, res);
        if (!hasAdminPermission) {
            return;
        }

        const { wardId, name } = req.body;

        if (!hasValue(wardId)) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Ward id is required"
            });
        }

        if (!hasValue(name)) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Room name is required"
            });
        }

        const trimmedWardId = String(wardId).trim();
        const roomName = String(name).trim();

        const ward = await wardManagementModel.findOne({ id: trimmedWardId });
        if (!ward) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: "Ward not found"
            });
        }

        const existingRoom = await roomManagementModel.findOne({
            name: { $regex: `^${escapeRegex(roomName)}$`, $options: "i" }
        });

        if (existingRoom) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Room already exists"
            });
        }

        const roomId = await generateUniqueId(
            roomManagementModel,
            "id",
            "ROOM"
        );

        const room = await roomManagementModel.create({
            id: roomId,
            wardId: trimmedWardId,
            name: roomName
        });

        res.status(201).json({
            code: 0,
            success: true,
            message: "Room created successfully",
            data: room
        });
    } catch (error) {
        res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};

// get room list
const getRoomList = async (req, res) => {
    try {
        const { wardId } = req.query;
        const filter = {};

        if (hasValue(wardId)) {
            filter.wardId = String(wardId).trim();
        }

        const roomList = await roomManagementModel.find(filter).sort({ createdAt: -1 });

        res.status(200).json({
            code: 0,
            success: true,
            roomList
        });
    } catch (error) {
        res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};

// delete room
const deleteRoom = async (req, res) => {
    try {
        const hasAdminPermission = await checkAdminPermission(req, res);
        if (!hasAdminPermission) {
            return;
        }

        const { roomId } = req.params;

        if (!hasValue(roomId)) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Room id is required"
            });
        }

        const deletedRoom = await roomManagementModel.findOneAndDelete({
            id: String(roomId).trim()
        });

        if (!deletedRoom) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: "Room not found"
            });
        }

        res.status(200).json({
            code: 0,
            success: true,
            message: "Room deleted successfully"
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
    createRoom,
    getRoomList,
    deleteRoom
};
