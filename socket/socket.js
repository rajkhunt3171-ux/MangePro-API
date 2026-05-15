import mongoose from "mongoose";
import messageModel from "../models/chat/message.js";
import conversationModel from "../models/chat/conversation.js";
import userModel from "../models/adminUser.js";

const onlineUsers = new Map();

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

const setupSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("Socket Connected:", socket.id);

        // USER SETUP
        socket.on("setup", (userId) => {
            socket.join(userId);
            onlineUsers.set(userId, socket.id);
            console.log("User Online:", userId);
            io.emit("online_users", Array.from(onlineUsers.keys()));
        });

        // JOIN CHAT
        socket.on("join_chat", (conversationId) => {
            socket.join(conversationId);
            console.log("Joined Chat:", conversationId);
        });

        // SEND MESSAGE
        socket.on("send_message", async (messageData) => {
            try {
                const { conversationId, senderId, receiverId, message, messageType } = messageData;
                const senderObjectId = await getUserObjectId(senderId);
                const receiverObjectId = await getUserObjectId(receiverId);

                if (!isValidObjectId(conversationId) || !senderObjectId || !receiverObjectId || !message?.trim()) {
                    return socket.emit("message_error", {
                        success: false,
                        message: "Valid conversationId, senderId, receiverId and message are required"
                    });
                }

                const newMessage = await messageModel.create({
                    conversationId,
                    senderId: senderObjectId,
                    receiverId: receiverObjectId,
                    message: message.trim(),
                    messageType: messageType || "text"
                });

                await conversationModel.findByIdAndUpdate(conversationId, {
                    lastMessage: newMessage.message
                });

                const savedMessage = await newMessage.populate([
                    { path: "senderId", select: "username email" },
                    { path: "receiverId", select: "username email" }
                ]);

                io.to(conversationId).emit("receive_message", {
                    success: true,
                    message: savedMessage
                });
            } catch (error) {
                console.log("Message save error:", error);
                socket.emit("message_error", {
                    success: false,
                    message: "Message save error"
                });
            }
        });

        // TYPING
        socket.on("typing", (conversationId) => {
            socket.to(conversationId).emit("typing");
        });

        // STOP TYPING
        socket.on("stop_typing", (conversationId) => {
            socket.to(conversationId).emit("stop_typing");
        });

        // DISCONNECT
        socket.on("disconnect", () => {
            console.log("Disconnected:", socket.id);

            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    break;
                }
            }
            io.emit("online_users", Array.from(onlineUsers.keys())
            );
        });
    });
};

export default setupSocket;
