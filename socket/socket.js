import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import messageModel from "../models/chat/message.js";
import conversationModel from "../models/chat/conversation.js";
import userModel from "../models/adminUser.js";
import { JWT_SECRET } from "../config/env.js";

const userSockets = new Map();
const socketUsers = new Map();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const userSelectFields = "_id id username email isOnline lastSeen";

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
        }).select(userSelectFields);
    }

    return userModel.findOne({ id }).select(userSelectFields);
};

const getTokenFromHandshake = (socket) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

    if (!token || typeof token !== "string") {
        return null;
    }

    return token.startsWith("Bearer ") ? token.slice(7) : token;
};

const getUserIdFromPayload = (payload) => {
    if (!payload) {
        return null;
    }

    if (typeof payload === "string") {
        return payload;
    }

    return payload.userId || payload.id || null;
};

const formatUserStatus = (user) => {
    if (!user) {
        return null;
    }

    return {
        userId: user._id.toString(),
        id: user.id,
        username: user.username,
        email: user.email,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
    };
};

const getOnlineUsersPayload = async (changedUser = null) => {
    const onlineUserIds = Array.from(userSockets.keys());
    const users = onlineUserIds.length
        ? await userModel.find({ _id: { $in: onlineUserIds } }).select(userSelectFields).lean()
        : [];

    return {
        onlineUserIds,
        users: users.map((user) => formatUserStatus({ ...user, isOnline: true })),
        changedUser: formatUserStatus(changedUser)
    };
};

const emitOnlineUsersUpdate = async (io, changedUser = null) => {
    const payload = await getOnlineUsersPayload(changedUser);

    io.emit("online_users_update", payload);
    io.emit("online_users", payload.onlineUserIds);
};

const markSocketOnline = async (io, socket, user) => {
    const userId = user._id.toString();
    const currentUserId = socketUsers.get(socket.id);

    if (currentUserId === userId && userSockets.get(userId)?.has(socket.id)) {
        return user;
    }

    if (currentUserId && currentUserId !== userId) {
        await markSocketOffline(io, socket);
    }

    let sockets = userSockets.get(userId);

    if (!sockets) {
        sockets = new Set();
        userSockets.set(userId, sockets);
    }

    const wasOffline = sockets.size === 0;

    sockets.add(socket.id);
    socketUsers.set(socket.id, userId);
    socket.join(userId);

    if (user.id) {
        socket.join(user.id);
    }

    if (!wasOffline) {
        user.isOnline = true;
        return user;
    }

    const updatedUser = await userModel.findByIdAndUpdate(
        userId,
        { isOnline: true },
        { new: true }
    ).select(userSelectFields);

    if (!userSockets.has(userId)) {
        const offlineUser = await userModel.findByIdAndUpdate(
            userId,
            {
                isOnline: false,
                lastSeen: new Date()
            },
            { new: true }
        ).select(userSelectFields);

        await emitOnlineUsersUpdate(io, offlineUser);
        return offlineUser;
    }

    await emitOnlineUsersUpdate(io, updatedUser);
    return updatedUser;
};

const markSocketOffline = async (io, socket) => {
    const userId = socketUsers.get(socket.id);

    if (!userId) {
        return null;
    }

    socketUsers.delete(socket.id);

    const sockets = userSockets.get(userId);

    if (!sockets) {
        return null;
    }

    sockets.delete(socket.id);

    if (sockets.size > 0) {
        return null;
    }

    userSockets.delete(userId);

    const updatedUser = await userModel.findByIdAndUpdate(
        userId,
        {
            isOnline: false,
            lastSeen: new Date()
        },
        { new: true }
    ).select(userSelectFields);

    if (userSockets.has(userId)) {
        const onlineUser = await userModel.findByIdAndUpdate(
            userId,
            { isOnline: true },
            { new: true }
        ).select(userSelectFields);

        await emitOnlineUsersUpdate(io, onlineUser);
        return onlineUser;
    }

    await emitOnlineUsersUpdate(io, updatedUser);
    return updatedUser;
};

const setupSocket = (io) => {
    io.use(async (socket, next) => {
        try {
            const token = getTokenFromHandshake(socket);

            if (!token) {
                return next();
            }

            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await getUserById(decoded.id || decoded.userId);

            if (!user) {
                return next(new Error("Authentication failed"));
            }

            socket.user = user;
            next();
        } catch {
            next(new Error("Authentication failed"));
        }
    });

    io.on("connection", (socket) => {
        if (socket.user) {
            markSocketOnline(io, socket, socket.user).catch(() => {});
        }

        // USER SETUP
        socket.on("setup", async (userId, callback) => {
            try {
                const user = socket.user || await getUserById(userId);

                if (!user) {
                    const response = {
                        success: false,
                        message: "Valid userId is required"
                    };

                    return typeof callback === "function" ? callback(response) : socket.emit("user_online", response);
                }

                const updatedUser = await markSocketOnline(io, socket, user);
                const response = {
                    success: true,
                    user: formatUserStatus(updatedUser)
                };

                if (typeof callback === "function") {
                    callback(response);
                } else {
                    socket.emit("user_online", response);
                }
            } catch {
                const response = {
                    success: false,
                    message: "Online status update failed"
                };

                if (typeof callback === "function") {
                    callback(response);
                } else {
                    socket.emit("user_online", response);
                }
            }
        });

        // MARK CURRENT SOCKET ONLINE
        socket.on("user_online", async (payload, callback) => {
            try {
                const userId = getUserIdFromPayload(payload);
                const user = socket.user || await getUserById(userId);

                if (!user) {
                    const response = {
                        success: false,
                        message: "Valid userId is required"
                    };

                    return typeof callback === "function" ? callback(response) : socket.emit("user_online", response);
                }

                const updatedUser = await markSocketOnline(io, socket, user);
                const response = {
                    success: true,
                    user: formatUserStatus(updatedUser)
                };

                if (typeof callback === "function") {
                    callback(response);
                } else {
                    socket.emit("user_online", response);
                }
            } catch {
                const response = {
                    success: false,
                    message: "Online status update failed"
                };

                if (typeof callback === "function") {
                    callback(response);
                } else {
                    socket.emit("user_online", response);
                }
            }
        });

        // MARK CURRENT SOCKET OFFLINE
        socket.on("user_offline", async (callback) => {
            try {
                const updatedUser = await markSocketOffline(io, socket);
                const response = {
                    success: true,
                    user: formatUserStatus(updatedUser)
                };

                if (typeof callback === "function") {
                    callback(response);
                } else {
                    socket.emit("user_offline", response);
                }
            } catch {
                const response = {
                    success: false,
                    message: "Offline status update failed"
                };

                if (typeof callback === "function") {
                    callback(response);
                } else {
                    socket.emit("user_offline", response);
                }
            }
        });

        // RETURN ONLINE USERS
        socket.on("get_online_users", async (callback) => {
            try {
                const payload = await getOnlineUsersPayload();

                if (typeof callback === "function") {
                    callback(payload);
                } else {
                    socket.emit("online_users_update", payload);
                }
            } catch {
                if (typeof callback === "function") {
                    callback({
                        onlineUserIds: [],
                        users: [],
                        changedUser: null
                    });
                }
            }
        });

        // JOIN CHAT
        socket.on("join_chat", (conversationId) => {
            socket.join(conversationId);
        });

        // SEND MESSAGE
        socket.on("send_message", async (messageData) => {
            try {
                const { conversationId, senderId, receiverId, message, messageType } = messageData;
                const senderUser = await getUserById(senderId);
                const receiverUser = await getUserById(receiverId);

                if (!isValidObjectId(conversationId) || !senderUser || !receiverUser || !message?.trim()) {
                    return socket.emit("message_error", {
                        success: false,
                        message: "Valid conversationId, senderId, receiverId and message are required"
                    });
                }

                const newMessage = await messageModel.create({
                    conversationId,
                    senderId: senderUser._id,
                    receiverId: receiverUser._id,
                    senderUserId: senderUser.id,
                    receiverUserId: receiverUser.id,
                    message: message.trim(),
                    messageType: messageType || "text"
                });

                await conversationModel.findByIdAndUpdate(conversationId, {
                    lastMessage: newMessage.message
                });

                const savedMessage = await newMessage.populate([
                    { path: "senderId", select: "id username email isOnline lastSeen" },
                    { path: "receiverId", select: "id username email isOnline lastSeen" }
                ]);

                io.to(conversationId).emit("receive_message", {
                    success: true,
                    message: savedMessage
                });
            } catch {
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
            markSocketOffline(io, socket).catch(() => {});
        });
    });
};

export default setupSocket;
