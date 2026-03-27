import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { createResult, deleteResult, listResults } from "../controllers/resultController.js";

export const resultsRouter = Router();

resultsRouter.get("/", asyncHandler(listResults));
resultsRouter.post("/", asyncHandler(createResult));
resultsRouter.delete("/:id", asyncHandler(deleteResult));
