import mongoose from "mongoose";

const loginUserSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    },
}, {
    timestamps: true
});

const loginUserModel = mongoose.model("LoginSession", loginUserSchema);

export default loginUserModel;