import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  createSubject,
  deleteSubject,
  listSubjects,
  updateSubject,
} from "../controllers/subjectController.js";

export const subjectsRouter = Router();

subjectsRouter.get("/", asyncHandler(listSubjects));
subjectsRouter.post("/", asyncHandler(createSubject));
subjectsRouter.put("/:id", asyncHandler(updateSubject));
subjectsRouter.delete("/:id", asyncHandler(deleteSubject));
