import * as resultService from "../services/resultService.js";

export async function listResults(req, res) {
  const data = await resultService.listResults({
    studentId: req.query.studentId ? Number(req.query.studentId) : undefined,
    subjectCode: req.query.subjectCode || undefined,
  });

  res.json(data);
}

export async function createResult(req, res) {
  const data = await resultService.createResult(req.body);
  res.status(201).json(data);
}

export async function deleteResult(req, res) {
  await resultService.deleteResult(Number(req.params.id));
  res.status(204).send();
}
