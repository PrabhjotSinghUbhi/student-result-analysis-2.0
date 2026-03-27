import * as subjectService from "../services/subjectService.js";

export async function listSubjects(req, res) {
  const data = await subjectService.listSubjects();
  res.json(data);
}

export async function createSubject(req, res) {
  const data = await subjectService.createSubject(req.body);
  res.status(201).json(data);
}

export async function updateSubject(req, res) {
  const data = await subjectService.updateSubject(Number(req.params.id), req.body);
  res.json(data);
}

export async function deleteSubject(req, res) {
  await subjectService.deleteSubject(Number(req.params.id));
  res.status(204).send();
}
