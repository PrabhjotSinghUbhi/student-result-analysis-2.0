import { Router } from "express";
import { studentsRouter } from "./students.js";
import { subjectsRouter } from "./subjects.js";
import { resultsRouter } from "./results.js";
import { analyticsRouter } from "./analytics.js";
import { reportsRouter } from "./reports.js";
import { uploadRouter } from "./upload.js";

export const router = Router();

router.use("/students", studentsRouter);
router.use("/subjects", subjectsRouter);
router.use("/results", resultsRouter);
router.use("/analytics", analyticsRouter);
router.use("/reports", reportsRouter);
router.use("/upload", uploadRouter);
