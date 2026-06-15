import mongoose from "mongoose";
const visitDataSchema = new mongoose.Schema(
    {
        visitId: {
            type: String,
            trim: true
        },
        patientId: {
            type: String,
            trim: true
        },
        visitDate: {
            type: String,
            trim: true
        },
        visitTime: {
            type: String,
            trim: true
        },
        cdId: {
            type: String,
            trim: true
        },
        department: {
            type: String,
            trim: true
        },
        priority: {
            type: String,
            trim: true
        },
        status: {
            type: String,
            default: "Waiting",
            trim: true
        },
        symptoms: {
            type: String,
            default: "",
            trim: true
        },
        allergies: {
            type: String,
            default: "",
            trim: true
        },
        idAdmitted: {
            type: Boolean,
            default: false
        },
        admissionDate: {
            type: String,
            default: "",
            trim: true
        },
        idDischarge: {
            type: Boolean,
            default: false
        },
        dischargeDate: {
            type: String,
            default: "",
            trim: true
        },
        bedId: {
            type: String,
            default: "",
            trim: true
        }
    },
    {
        _id: false
    }
);

const patientManagementSchema = new mongoose.Schema(
    {
        patientId: {
            type: String,
            unique: true,
            trim: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        number: {
            type: String,
            required: true,
            trim: true
        },
        age: {
            type: Number,
            required: true,
            min: 0
        },
        gender: {
            type: String,
            required: true,
            trim: true
        },
        dob: {
            type: String,
            default: "",
            trim: true
        },
        bloodGroup: {
            type: String,
            default: "",
            trim: true
        },
        address: {
            type: String,
            default: "",
            trim: true
        },
        visitData: {
            type: [visitDataSchema],
            default: []
        },
        emergencyContactName: {
            type: String,
            default: "",
            trim: true
        },
        emergencyContactRelation: {
            type: String,
            default: "",
            trim: true
        },
        emergencyContactNumber: {
            type: String,
            default: "",
            trim: true
        },
        isNewPatient: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const PatientManagementModel = mongoose.model("patient", patientManagementSchema);

export default PatientManagementModel;
