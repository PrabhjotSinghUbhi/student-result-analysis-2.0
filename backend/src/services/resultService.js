import { z } from "zod";
import { query } from "../db/pool.js";
import { httpError } from "../utils/httpError.js";

const resultSchema = z.object({
  student_id: z.number().int().positive(),
  subject_id: z.number().int().positive(),
  internal_marks: z.number().nonnegative().nullable().optional(),
  external_marks: z.number().nonnegative().nullable().optional(),
  grade: z.string().min(1),
  grade_points: z.number().min(0).max(10),
});

async function ensureSubjectExists(subjectId) {
  const { rows } = await query("SELECT id FROM subjects WHERE id = ?", [subjectId]);
  if (!rows.length) {
    throw httpError(400, "Invalid subject_id");
  }
}

async function getResultById(id) {
  const { rows } = await query(
    `SELECT id, student_id, subject_id, internal_marks, external_marks, total_marks, grade, grade_points
     FROM results
     WHERE id = ?`,
    [id]
  );

  return rows[0] || null;
}

export async function listResults(filters = {}) {
  const clauses = [];
  const values = [];

  if (filters.studentId) {
    values.push(filters.studentId);
    clauses.push("r.student_id = ?");
  }

  if (filters.subjectCode) {
    values.push(filters.subjectCode);
    clauses.push("sb.subject_code = ?");
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const { rows } = await query(
    `SELECT
      r.id,
      r.student_id,
      st.uid,
      st.name AS student_name,
      st.cgpa,
      r.subject_id,
      sb.subject_code,
      sb.subject_name,
      sb.credits,
      r.internal_marks,
      r.external_marks,
      r.total_marks,
      r.grade,
      r.grade_points
     FROM results r
     JOIN students st ON st.id = r.student_id
     JOIN subjects sb ON sb.id = r.subject_id
     ${where}
     ORDER BY st.uid ASC, sb.subject_code ASC`,
    values
  );

  return rows;
}

export async function createResult(payload) {
  const data = resultSchema.parse(payload);
  await ensureSubjectExists(data.subject_id);
  const totalMarks = Number(data.internal_marks || 0) + Number(data.external_marks || 0);

  try {
    const created = await query(
      `INSERT INTO results (student_id, subject_id, internal_marks, external_marks, total_marks, grade, grade_points)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.student_id,
        data.subject_id,
        data.internal_marks ?? null,
        data.external_marks ?? null,
        totalMarks,
        data.grade,
        data.grade_points,
      ]
    );

    return getResultById(created.insertId);
  } catch (err) {
    if (err.code === "ER_NO_REFERENCED_ROW_2") {
      throw httpError(400, "Invalid student_id or subject_id");
    }
    if (err.code === "ER_DUP_ENTRY") {
      throw httpError(409, "Result already exists for this student and subject");
    }
    throw err;
  }
}

export async function upsertResult(payload) {
  const data = resultSchema.parse(payload);
  await ensureSubjectExists(data.subject_id);
  const totalMarks = Number(data.internal_marks || 0) + Number(data.external_marks || 0);

  const upserted = await query(
    `INSERT INTO results (student_id, subject_id, internal_marks, external_marks, total_marks, grade, grade_points)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       id = LAST_INSERT_ID(id),
       internal_marks = VALUES(internal_marks),
       external_marks = VALUES(external_marks),
       total_marks = VALUES(total_marks),
       grade = VALUES(grade),
       grade_points = VALUES(grade_points),
       updated_at = CURRENT_TIMESTAMP`,
    [
      data.student_id,
      data.subject_id,
      data.internal_marks ?? null,
      data.external_marks ?? null,
      totalMarks,
      data.grade,
      data.grade_points,
    ]
  );

  return getResultById(upserted.insertId);
}

export async function deleteResult(id) {
  const { rowCount } = await query("DELETE FROM results WHERE id = ?", [id]);
  if (!rowCount) {
    throw httpError(404, "Result not found");
  }
}
