import mongoose from 'mongoose';

const paymentDetailsSchema = new mongoose.Schema({
    payment_id: {
        type: String,
        sparse: true
    },
    transaction_id: {
        type: String,
        sparse: true
    },
    gateway: {
        type: String,
        enum: ['razorpay', 'cashfree', 'stripe', 'phonepe']
    },
    payment_method: {
        type: String,
        enum: ['Card', 'UPI', 'NetBanking', 'Wallet']
    },
    currency: {
        type: String,
        default: 'INR'
    },
    payment_status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },
    payment_date: {
        type: String
    },
    payment_time: {
        type: String
    }
}, {
    timestamps: true
});

const orderSchema = new mongoose.Schema({
    order_id: {
        type: String
    },
    user_id: {
        type: String
    },
    customer_name: {
        type: String
    },
    order_date: {
        type: String
    },
    order_time: {
        type: String
    },
    amount: {
        type: Number,
        required: true
    },
    payment_details: paymentDetailsSchema
}, {
    timestamps: true
});

const orderModel = mongoose.model('order', orderSchema);

export default orderModel;
