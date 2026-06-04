import mongoose from "mongoose";


const wardManagementSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true
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
)

const wardManagementModel = mongoose.model("Ward", wardManagementSchema);

export default wardManagementModel;
