import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  createStudent,
  deleteStudent,
  getStudentById,
  listStudents,
  updateStudent,
} from "../controllers/studentController.js";

export const studentsRouter = Router();

studentsRouter.get("/", asyncHandler(listStudents));
studentsRouter.get("/:id", asyncHandler(getStudentById));
studentsRouter.post("/", asyncHandler(createStudent));
studentsRouter.put("/:id", asyncHandler(updateStudent));
studentsRouter.delete("/:id", asyncHandler(deleteStudent));
