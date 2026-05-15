import conversationModel from "../models/chat/conversation.js";
import messageModel from "../models/chat/message.js";
import userModel from "../models/adminUser.js";
import mongoose from "mongoose";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getUserObjectId = async (id) => {
    if (!id) {
        return null;
    }

    if (isValidObjectId(id)) {
        return id;
    }

    const user = await userModel.findOne({ id }).select("_id");
    return user?._id;
};

// CREATE OR GET CONVERSATION
const createConversation = async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;
        const senderObjectId = await getUserObjectId(senderId);
        const receiverObjectId = await getUserObjectId(receiverId);

        if (!senderObjectId || !receiverObjectId) {
            return res.status(400).json({
                success: false,
                message: "Valid senderId and receiverId are required"
            });
        }

        let conversation = await conversationModel.findOne({
            participants: {
                $all: [senderObjectId, receiverObjectId]
            }
        });

        if (!conversation) {
            conversation = await conversationModel.create({
                participants: [senderObjectId, receiverObjectId]
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

        const messages = await messageModel.find({ conversationId }).sort({ createdAt: 1 });

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
        const userObjectId = await getUserObjectId(userId);

        if (!userObjectId) {
            return res.status(400).json({
                success: false,
                message: "Valid userId is required"
            });
        }

        const conversations = await conversationModel.find({ participants: userObjectId }).populate("participants", "username email")
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
