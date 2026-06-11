import mongoose from "mongoose";

export const APPOINTMENT_STATUSES = ["Requested", "Approved", "Rejected", "Completed", "Cancelled"];

const appointmentSchema = new mongoose.Schema(
    {
        appointmentId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        patientId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        status: {
            type: String,
            enum: APPOINTMENT_STATUSES,
            default: "Requested",
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
