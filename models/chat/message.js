import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation"
    },

    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "adminUser"
    },

    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "adminUser"
    },

    message: {
        type: String,
        required: true
    },

    messageType: {
        type: String,
        enum: ["text", "image", "file"],
        default: "text"
    },

    isSeen: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});


const messageModel = mongoose.model("Message", messageSchema);

export default messageModel;
