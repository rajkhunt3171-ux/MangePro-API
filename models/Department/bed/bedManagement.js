import mongoose from "mongoose";

export const BED_STATUSES = ["available", "occupied", "reserved", "cleaning", "maintenance"];

const bedManagementSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true
        },
        wardId: {
            type: String,
            required: true,
            trim: true
        },
        roomId: {
            type: String,
            required: true,
            trim: true
        },
        patientId: {
            type: String,
            trim: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        status: {
            type: String,
            enum: BED_STATUSES,
            default: "available"
        },
        charge: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

bedManagementSchema.index({ roomId: 1, name: 1 }, { unique: true });

const bedManagementModel = mongoose.model("Bed", bedManagementSchema);

export default bedManagementModel;
