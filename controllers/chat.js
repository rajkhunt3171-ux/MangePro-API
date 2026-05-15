import conversationModel from "../models/chat/conversation.js";
import messageModel from "../models/chat/message.js";
import userModel from "../models/adminUser.js";
import mongoose from "mongoose";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getUserById = async (id) => {
    if (!id) {
        return null;
    }

    if (isValidObjectId(id)) {
        return userModel.findOne({
            $or: [
                { _id: id },
                { id: id.toString() }
            ]
        }).select("_id id username email");
    }

    return userModel.findOne({ id }).select("_id id username email");
};

// CREATE OR GET CONVERSATION
const createConversation = async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;
        const senderUser = await getUserById(senderId);
        const receiverUser = await getUserById(receiverId);

        if (!senderUser || !receiverUser) {
            return res.status(400).json({
                success: false,
                message: "Valid senderId and receiverId are required"
            });
        }

        let conversation = await conversationModel.findOne({
            participants: {
                $all: [senderUser._id, receiverUser._id]
            }
        });

        if (!conversation) {
            conversation = await conversationModel.create({
                participants: [senderUser._id, receiverUser._id]
            });
        }
        res.status(200).json({
            success: true,
            conversation
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Conversation error"
        });
    }
};



// ============================
// GET ALL MESSAGES
// ============================

const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;

        if (!isValidObjectId(conversationId)) {
            return res.status(400).json({
                success: false,
                message: "Valid conversationId is required"
            });
        }

        const messages = await messageModel.find({ conversationId })
            .populate("senderId", "id username email")
            .populate("receiverId", "id username email")
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            messages
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Messages fetch error"
        });
    }
};



// ============================
// GET USER CONVERSATIONS
// ============================

const getUserConversations = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await getUserById(userId);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Valid userId is required"
            });
        }

        const conversations = await conversationModel.find({ participants: user._id }).populate("participants", "id username email")
            .sort({ updatedAt: -1 });
        res.status(200).json({
            success: true,
            conversations
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Conversation fetch error"
        });
    }
};

export { createConversation, getMessages, getUserConversations };
