import express from "express";
import { PORT } from "./config/env.js";
import connectDB from "./dataBase/database.js";
import authRoutes from "./routes/authRoutes.js";
import departmentRoutes from "./routes/department.js";
import coreDepartmentRoutes from "./routes/coreDepartment.js";
import cors from 'cors';


const app = express();
app.use(express.json());

// Disable caching to prevent 304 responses
app.use((req, res, next) => {
    // Remove ETag header to prevent conditional requests
    res.removeHeader('ETag');
    
    // Set strong cache control headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    // Add timestamp to prevent caching
    res.setHeader('Last-Modified', new Date().toUTCString());
    
    next();
});

// Disable ETag generation completely
app.disable('etag');

// Handle conditional requests to prevent 304 responses
app.use((req, res, next) => {
    // If request has conditional headers, ignore them
    if (req.headers['if-none-match'] || req.headers['if-modified-since']) {
        delete req.headers['if-none-match'];
        delete req.headers['if-modified-since'];
    }
    next();
});

app.use(cors({
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token'],
    credentials: true
}));

app.use('/api/auth', authRoutes);

app.use('/api/department', departmentRoutes);

app.use('/api/coredepart', coreDepartmentRoutes);


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