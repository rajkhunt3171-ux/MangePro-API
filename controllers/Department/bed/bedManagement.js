import userModel from "../../../models/adminUser.js";
import bedManagementModel, { BED_STATUSES } from "../../../models/Department/bed/bedManagement.js";
import PatientManagementModel from "../../../models/Department/medicalDepartment/patientManagement.js";
import roomManagementModel from "../../../models/Department/room/roomManagement.js";
import wardManagementModel from "../../../models/Department/ward/wardManagement.js";
import generateUniqueId from "../../../utils/generateId.js";

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== "";

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeBedStatus = (status) => String(status).trim().toLowerCase();

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

        const { wardId, roomId, name, status } = req.body;

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
        const bedStatus = hasValue(status) ? normalizeBedStatus(status) : undefined;

        if (bedStatus && !BED_STATUSES.includes(bedStatus)) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: `Status must be one of: ${BED_STATUSES.join(", ")}`
            });
        }

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
            name: bedName,
            ...(bedStatus && { status: bedStatus })
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
        const { wardId, roomId, status } = req.query;
        const filter = {};

        if (hasValue(wardId)) {
            filter.wardId = String(wardId).trim();
        }

        if (hasValue(roomId)) {
            filter.roomId = String(roomId).trim();
        }

        if (hasValue(status)) {
            const bedStatus = normalizeBedStatus(status);

            if (!BED_STATUSES.includes(bedStatus)) {
                return res.status(400).json({
                    code: 1,
                    success: false,
                    message: `Status must be one of: ${BED_STATUSES.join(", ")}`
                });
            }

            filter.status = bedStatus;
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

// change bed status
const changeBedStatus = async (req, res) => {
    try {
        const hasAdminPermission = await checkAdminPermission(req, res);
        if (!hasAdminPermission) {
            return;
        }

        const { bedId, status } = req.body;

        if (!hasValue(bedId)) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Bed id is required"
            });
        }

        if (!hasValue(status)) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Status is required"
            });
        }

        const bedStatus = normalizeBedStatus(status);

        if (!BED_STATUSES.includes(bedStatus)) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: `Status must be one of: ${BED_STATUSES.join(", ")}`
            });
        }

        const updatedBed = await bedManagementModel.findOneAndUpdate(
            { id: String(bedId).trim() },
            { $set: { status: bedStatus } },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedBed) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: "Bed not found"
            });
        }

        res.status(200).json({
            code: 0,
            success: true,
            message: "Bed status changed successfully",
            data: updatedBed
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

const assignPatientToBed = async (req, res) => {
    try {
        const { bedId, patientId, allocationStatus } = req.body;
        const selectedBedId = hasValue(bedId) ? String(bedId).trim() : "";

        if (!hasValue(selectedBedId)) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Bed id is required"
            });
        }

        if (!hasValue(patientId)) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Patient id is required"
            });
        }

        const selectedPatientId = String(patientId).trim();
        const bedStatus = hasValue(allocationStatus) ? normalizeBedStatus(allocationStatus) : "occupied";

        if (!BED_STATUSES.includes(bedStatus)) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: `Allocation status must be one of: ${BED_STATUSES.join(", ")}`
            });
        }

        const [bed, patient] = await Promise.all([
            bedManagementModel.findOne({ id: selectedBedId }),
            PatientManagementModel.findOne({ patientId: selectedPatientId })
        ]);

        if (!bed) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: "Bed not found"
            });
        }

        if (!patient) {
            return res.status(404).json({
                code: 1,
                success: false,
                message: "Patient not found"
            });
        }

        if (hasValue(bed.patientId) && bed.patientId !== selectedPatientId) {
            return res.status(400).json({
                code: 1,
                success: false,
                message: "Bed is already assigned to another patient"
            });
        }

        const updates = [];

        if (hasValue(patient.bedId) && patient.bedId !== selectedBedId) {
            updates.push(
                bedManagementModel.findOneAndUpdate(
                    { id: patient.bedId, patientId: selectedPatientId },
                    {
                        $set: { status: "available" },
                        $unset: { patientId: "" }
                    },
                    { runValidators: true }
                )
            );
        }

        updates.push(
            bedManagementModel.findOneAndUpdate(
                { id: selectedBedId },
                {
                    $set: {
                        patientId: selectedPatientId,
                        status: bedStatus
                    }
                },
                {
                    new: true,
                    runValidators: true
                }
            ),
            PatientManagementModel.findOneAndUpdate(
                { patientId: selectedPatientId },
                { $set: { bedId: selectedBedId } },
                {
                    new: true,
                    runValidators: true
                }
            )
        );

        const results = await Promise.all(updates);
        const [updatedBed, updatedPatient] = results.slice(-2);

        res.status(200).json({
            code: 0,
            success: true,
            message: "Patient assigned to bed successfully",
            data: {
                bed: updatedBed,
                patient: updatedPatient
            }
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
    changeBedStatus,
    deleteBed,
    assignPatientToBed
};
