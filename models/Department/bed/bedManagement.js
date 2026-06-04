import mongoose from "mongoose";

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
        name: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

bedManagementSchema.index({ roomId: 1, name: 1 }, { unique: true });

const bedManagementModel = mongoose.model("Bed", bedManagementSchema);

export default bedManagementModel;
