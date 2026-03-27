import { z } from "zod";
import { query } from "../db/pool.js";
import { httpError } from "../utils/httpError.js";

const studentSchema = z.object({
  uid: z.string().min(1),
  name: z.string().min(2),
  cgpa: z.number().min(0).max(10).optional().nullable(),
});

export async function listStudents() {
  const { rows } = await query("SELECT id, uid, name, cgpa FROM students ORDER BY uid");
  return rows;
}

export async function getStudentById(id) {
  const { rows } = await query("SELECT id, uid, name, cgpa FROM students WHERE id = ?", [id]);

  if (!rows.length) {
    throw httpError(404, "Student not found");
  }

  return rows[0];
}

export async function createStudent(payload) {
  const data = studentSchema.parse(payload);

  try {
    const created = await query(
      `INSERT INTO students (uid, name, cgpa)
       VALUES (?, ?, ?)`,
      [data.uid, data.name, data.cgpa ?? null]
    );

    const { rows } = await query("SELECT id, uid, name, cgpa FROM students WHERE id = ?", [created.insertId]);

    return rows[0];
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw httpError(409, "uid already exists");
    }
    throw err;
  }
}

export async function updateStudent(id, payload) {
  const data = studentSchema.partial().parse(payload);
  const keys = Object.keys(data);

  if (!keys.length) {
    throw httpError(400, "At least one field is required");
  }

  const values = keys.map((k) => data[k]);
  const setClause = keys.map((k) => `${k} = ?`).join(", ");

  try {
    const updated = await query(
      `UPDATE students
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [...values, id]
    );

    if (!updated.rowCount) {
      throw httpError(404, "Student not found");
    }

    const { rows } = await query("SELECT id, uid, name, cgpa FROM students WHERE id = ?", [id]);

    return rows[0];
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw httpError(409, "uid already exists");
    }
    throw err;
  }
}

export async function deleteStudent(id) {
  const { rowCount } = await query("DELETE FROM students WHERE id = ?", [id]);
  if (!rowCount) {
    throw httpError(404, "Student not found");
  }
}
