import express from "express";
import dashboardController from "../controllers/dashboardController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/get-dashboard-summary", authMiddleware, dashboardController.getDashboardSummary);

export default router;
