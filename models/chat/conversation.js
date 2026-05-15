import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "adminUser"
    }],

    lastMessage: {
        type: String
    }

}, {
    timestamps: true
});

const conversationModel = mongoose.model("Conversation", conversationSchema);

export default conversationModel;
