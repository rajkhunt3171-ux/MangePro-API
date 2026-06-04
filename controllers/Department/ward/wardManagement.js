import userModel from "../../../models/adminUser.js";
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

// create ward
const createWard = async (req, res) => {
    try {
        const hasAdminPermission = await checkAdminPermission(req, res);
        if (!hasAdminPermission) {
            return;
        }

        const { name } = req.body;

        if (!hasValue(name)) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Ward name is required"
            });
        }

        const wardName = String(name).trim();
        const existingWard = await wardManagementModel.findOne({
            name: { $regex: `^${escapeRegex(wardName)}$`, $options: "i" }
        });

        if (existingWard) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Ward already exists"
            });
        }

        const wardId = await generateUniqueId(
            wardManagementModel,
            "id",
            "WARD"
        );

        const ward = await wardManagementModel.create({
            id: wardId,
            name: wardName
        });

        res.status(201).json({
            code: 0,
            success: true,
            message: "Ward created successfully",
            data: ward
        });
    } catch (error) {
        res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};

// get ward list
const getWardList = async (req, res) => {
    try {
        const wardList = await wardManagementModel.find().sort({ createdAt: -1 });

        res.status(200).json({
            code: 0,
            success: true,
            wardList
        });
    } catch (error) {
        res.status(500).json({
            code: 1,
            success: false,
            message: error.message
        });
    }
};

// delete ward
const deleteWard = async (req, res) => {
    try {
        const hasAdminPermission = await checkAdminPermission(req, res);
        if (!hasAdminPermission) {
            return;
        }

        const { wardId } = req.params;

        if (!hasValue(wardId)) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Ward id is required"
            });
        }

        const deletedWard = await wardManagementModel.findOneAndDelete({
            id: String(wardId).trim()
        });

        if (!deletedWard) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: "Ward not found"
            });
        }

        res.status(200).json({
            code: 0,
            success: true,
            message: "Ward deleted successfully"
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
    createWard,
    getWardList,
    deleteWard
};
