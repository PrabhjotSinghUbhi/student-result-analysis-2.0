import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getDashboardStats, getStudentTrend } from "../controllers/analyticsController.js";

export const analyticsRouter = Router();

analyticsRouter.get("/dashboard", asyncHandler(getDashboardStats));
analyticsRouter.get("/students/:studentId/trend", asyncHandler(getStudentTrend));
