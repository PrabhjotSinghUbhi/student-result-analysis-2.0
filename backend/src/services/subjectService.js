import { z } from "zod";
import { query } from "../db/pool.js";
import { httpError } from "../utils/httpError.js";

const subjectSchema = z.object({
  subject_code: z.string().min(1),
  subject_name: z.string().min(2),
  credits: z.number().int().min(1),
});

export async function listSubjects() {
  const { rows } = await query("SELECT id, subject_code, subject_name, credits FROM subjects ORDER BY subject_code");
  return rows;
}

async function getSubjectById(id) {
  const { rows } = await query("SELECT id, subject_code, subject_name, credits FROM subjects WHERE id = ?", [id]);
  return rows[0] || null;
}

export async function createSubject(payload) {
  const data = subjectSchema.parse(payload);

  try {
    const created = await query(
      `INSERT INTO subjects (subject_code, subject_name, credits)
       VALUES (?, ?, ?)`,
      [data.subject_code, data.subject_name, data.credits]
    );

    return getSubjectById(created.insertId);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw httpError(409, "subject_code already exists");
    }
    throw err;
  }
}

export async function updateSubject(id, payload) {
  const data = subjectSchema.partial().parse(payload);
  const keys = Object.keys(data);

  if (!keys.length) {
    throw httpError(400, "At least one field is required");
  }

  const setClause = keys.map((k) => `${k} = ?`).join(", ");

  try {
    const updated = await query(
      `UPDATE subjects
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [...keys.map((k) => data[k]), id]
    );

    if (!updated.rowCount) {
      throw httpError(404, "Subject not found");
    }

    return getSubjectById(id);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw httpError(409, "subject_code already exists");
    }
    throw err;
  }
}

export async function deleteSubject(id) {
  const { rowCount } = await query("DELETE FROM subjects WHERE id = ?", [id]);
  if (!rowCount) {
    throw httpError(404, "Subject not found");
  }
}
