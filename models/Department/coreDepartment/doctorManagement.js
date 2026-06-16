import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({
    patientId: {
        type: String,
        trim: true
    },
    drId: {
        type: String,
        trim: true
    },
    charge: {
        type: Number,
        default: 0
    },
    balance: {
        type: Number,
        default: 0
    },
    time: {
        type: Date,
        default: Date.now
    }
}, {
    _id: false
});

const leaveSchema = new mongoose.Schema(
    {
        leave_id: {
            type: Number,
            required: true
        },
        leave_type: {
            type: String,
            required: true,
            enum: ["full_day", "half_day", "emergency", "weekly_off"],
            trim: true
        },
        from_date: {
            type: String,
            required: true,
            trim: true
        },
        to_date: {
            type: String,
            required: true,
            trim: true
        },
        from_time: {
            type: String,
            default: null,
            trim: true
        },
        to_time: {
            type: String,
            default: null,
            trim: true
        },
        reason: {
            type: String,
            default: "",
            trim: true
        },
        note: {
            type: String,
            default: "",
            trim: true
        },
        is_available: {
            type: Boolean,
            default: false
        },
        created_at: {
            type: String,
            default: () => new Date().toISOString()
        }
    },
    {
        _id: false
    }
);

const drDepartmentSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            unique: true
        },
        type: {
            type: Number,
            enum: [1, 2],           // 1 = Regular, 2 = Visiting, 3 = OnCall etc.
            default: 1
        },
        name: {
            type: String,
            trim: true,
        },
        specification: {
            type: String,
            trim: true,
        },

        qualification: {
            type: String,
            trim: true,
        },

        experience: {
            type: Number,
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
        leave: {
            type: [leaveSchema],
            default: []
        },
        status: {
            type: String,
            enum: ['Active', 'Inactive'],
            default: 'Active'
        },
        password: {
            type: String
        },
        walletList: {
            type: [walletSchema],
            default: []
        }
    },
    {
        timestamps: true,
    }
);

const DrDepartmentModel = mongoose.model("Doctor", drDepartmentSchema);

export default DrDepartmentModel;
