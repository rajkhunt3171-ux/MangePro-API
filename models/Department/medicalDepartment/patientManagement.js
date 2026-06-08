import mongoose from "mongoose";

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
        visitDate: {
            type: String,
            required: true,
            trim: true
        },
        visitTime: {
            type: String,
            required: true,
            trim: true
        },
        cdId: {
            type: String,
            required: true,
            trim: true
        },
        department: {
            type: String,
            required: true,
            trim: true
        },
        priority: {
            type: String,
            required: true,
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
        currentMedication: {
            type: String,
            default: "",
            trim: true
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
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const PatientManagementModel = mongoose.model("patient", patientManagementSchema);

export default PatientManagementModel;
