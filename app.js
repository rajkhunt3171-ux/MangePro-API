import express from "express";
import { PORT } from "./config/env.js";
import connectDB from "./dataBase/database.js";
import authRoutes from "./routes/authRoutes.js";
import departmentRoutes from "./routes/department.js";
import coreDepartmentRoutes from "./routes/coreDepartment.js";
import cors from 'cors';


const app = express();
app.use(express.json());

app.use(cors({
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token'],
    credentials: true
}));

app.use('/api/auth', authRoutes);

app.use('/api/department', departmentRoutes);

app.use('/api/coredepart', coreDepartmentRoutes)

// Start server AFTER DB connection
const startServer = async () => {
    try {
        await connectDB();
        console.log("Database connected");

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error("DB connection failed", error);
        process.exit(1);
    }
};

startServer();