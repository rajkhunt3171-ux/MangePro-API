import mongoose from "mongoose";

const drDepartmentSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            unique: true
        },
        type: {
            type: Number,
            required: true,
            enum: [1, 2],           // 1 = Regular, 2 = Visiting, 3 = OnCall etc.
            default: 1
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        specification: {
            type: String,
            required: true,
            trim: true,
        },

        qualification: {
            type: String,
            required: true,
            trim: true,
        },

        experience: {
            type: Number,
            required: true,
        },

        contactDetails: {
            phone: {
                type: String,
                required: true,
                trim: true,
            },

            email: {
                type: String,
                trim: true,
                lowercase: true,
            },

            address: {
                type: String,
                trim: true,
            },
        },
        profileImage: {
            type: String,
            default: "",
        },
        commission: {
            type: Number,
            default: 0,
        },
        shiftStartTime: {
            type: String,
            default: "09:00"
        },
        shiftEndTime: {
            type: String,
            default: "17:00"
        },
        weeklyOff: {
            type: [String],
            default: ["Sunday"]
        },
        status: {
            type: String,
            enum: ['Active', 'Inactive'],
            default: 'Active'
        },
    },
    {
        timestamps: true,
    }
);

const DrDepartmentModel = mongoose.model("Doctor", drDepartmentSchema);

export default DrDepartmentModel;