import express from "express";
import http from "http";
import { Server } from "socket.io";

import cors from "cors";

import { PORT } from "./config/env.js";

import connectDB from "./dataBase/database.js";

import authRoutes from "./routes/authRoutes.js";
import departmentRoutes from "./routes/department.js";
import coreDepartmentRoutes from "./routes/coreDepartment.js";
import chatRoutes from "./routes/chatRoutes.js";
import setupSocket from "./socket/socket.js";
import mdRoutes from "./routes/medicalDepartment.js";
import wardsRoutes from "./routes/wardRoutes.js";
import roomsRoutes from "./routes/roomRoutes.js";
import bedsRoutes from "./routes/bedRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";


const app = express();

// SOCKET SERVER
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:4200",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true
    }
});

// MIDDLEWARE
app.use(express.json());

app.use(cors({
    origin: "http://localhost:4200",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-access-token"
    ],
    credentials: true
}));


// DISABLE CACHE
app.disable("etag");

app.use((req, res, next) => {

    res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
    );

    res.setHeader("Pragma", "no-cache");

    res.setHeader("Expires", "0");

    next();
});


// ROUTES
app.use("/api/auth", authRoutes);

app.use("/api/department", departmentRoutes);

app.use("/api/coredepart", coreDepartmentRoutes);

app.use("/api/chat", chatRoutes);

app.use("/api/medicaldepartment", mdRoutes);

app.use("/api/wards", wardsRoutes);

app.use("/api/room", roomsRoutes);

app.use("/api/bed", bedsRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/order", orderRoutes);

setupSocket(io);

// START SERVER
const startServer = async () => {
    try {
        await connectDB();
        console.log("Database connected");
        server.listen(PORT, () => {
            console.log(
                `Server running on port ${PORT}`
            );
        });
    } catch (error) {
        console.log("DB connection failed", error);
        process.exit(1);
    }
};

startServer();
