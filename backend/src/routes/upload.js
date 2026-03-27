import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { uploadResults } from "../controllers/uploadController.js";

export const uploadRouter = Router();

const upload = multer({ storage: multer.memoryStorage() });

uploadRouter.post("/results", upload.single("file"), asyncHandler(uploadResults));
