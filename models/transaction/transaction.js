import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
    {
        transactionId: {
            type: String,
            unique: true,
            trim: true
        },
        patientId: {
            type: String,
            trim: true
        },
        visitId: {
            type: String,
            trim: true
        },
        drId: {
            type: String,
            trim: true
        },
        adminUserId: {
            type: String,
            trim: true
        },
        charge: {
            type: Number,
            default: 0
        },
        paymentType: {
            type: String,
            trim: true
        },
        paymentStatus: {
            type: String,
            trim: true
        },
        doctorCommission: {
            type: Number,
            default: 0
        },
        commissionAmount: {
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
    },
    {
        timestamps: true
    }
);

const TransactionModel = mongoose.model("Transaction", transactionSchema);

export default TransactionModel;
