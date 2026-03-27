import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { downloadStudentCsv, downloadStudentPdf } from "../controllers/reportController.js";

export const reportsRouter = Router();

reportsRouter.get("/students/:studentId/csv", asyncHandler(downloadStudentCsv));
reportsRouter.get("/students/:studentId/pdf", asyncHandler(downloadStudentPdf));
