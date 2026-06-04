import mongoose from "mongoose";

const roomManagementSchema = new mongoose.Schema(
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
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const roomManagementModel = mongoose.model("Room", roomManagementSchema);

export default roomManagementModel;
