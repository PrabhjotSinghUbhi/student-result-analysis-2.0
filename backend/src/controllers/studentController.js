import * as studentService from "../services/studentService.js";

export async function listStudents(req, res) {
  const data = await studentService.listStudents();
  res.json(data);
}

export async function getStudentById(req, res) {
  const data = await studentService.getStudentById(Number(req.params.id));
  res.json(data);
}

export async function createStudent(req, res) {
  const data = await studentService.createStudent(req.body);
  res.status(201).json(data);
}

export async function updateStudent(req, res) {
  const data = await studentService.updateStudent(Number(req.params.id), req.body);
  res.json(data);
}

export async function deleteStudent(req, res) {
  await studentService.deleteStudent(Number(req.params.id));
  res.status(204).send();
}
