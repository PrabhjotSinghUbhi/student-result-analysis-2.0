import ExcelJS from "exceljs";
import { parse as parseCsv } from "csv-parse/sync";
import { query } from "../db/pool.js";
import { upsertResult } from "./resultService.js";
import { httpError } from "../utils/httpError.js";

function normalizeHeaderKey(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_")
    .trim()
    .toLowerCase();
}

function toNullableNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeRow(row) {
  return {
    uid: String(row.uid || "").trim(),
    name: String(row.name || "").trim(),
    cgpa: toNullableNumber(row.cgpa),
    subject_code: String(row.subject_code || "").trim(),
    subject_name: String(row.subject_name || "").trim(),
    credits: Number(row.credits),
    internal_marks: toNullableNumber(row.internal),
    external_marks: toNullableNumber(row.external),
    grade: String(row.grade || "").trim(),
    grade_points: Number(row.grade_points),
  };
}

async function upsertStudent(uid, name, cgpa) {
  const upserted = await query(
    `INSERT INTO students (uid, name, cgpa)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       id = LAST_INSERT_ID(id),
       name = VALUES(name),
       cgpa = VALUES(cgpa),
       updated_at = CURRENT_TIMESTAMP`,
    [uid, name, cgpa]
  );

  const { rows } = await query("SELECT id FROM students WHERE id = ?", [upserted.insertId]);
  return rows[0]?.id || null;
}

async function upsertSubject(subjectCode, subjectName, credits) {
  const upserted = await query(
    `INSERT INTO subjects (subject_code, subject_name, credits)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       id = LAST_INSERT_ID(id),
       subject_name = VALUES(subject_name),
       credits = VALUES(credits),
       updated_at = CURRENT_TIMESTAMP`,
    [subjectCode, subjectName, credits]
  );

  const { rows } = await query("SELECT id FROM subjects WHERE id = ?", [upserted.insertId]);
  return rows[0]?.id || null;
}

export async function processBulkUpload(fileBuffer, originalName) {
  if (!fileBuffer) {
    throw httpError(400, "No file provided");
  }

  const lowerName = String(originalName || "").toLowerCase();
  let rows = [];

  if (lowerName.endsWith(".csv")) {
    const text = fileBuffer.toString("utf-8");
    rows = parseCsv(text, {
      columns: (header) => header.map(normalizeHeaderKey),
      skip_empty_lines: true,
      trim: true,
    });
  } else if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      throw httpError(400, "Uploaded workbook has no sheet");
    }

    const headerRow = worksheet.getRow(1).values;
    const headers = [];
    for (let i = 1; i < headerRow.length; i += 1) {
      headers.push(normalizeHeaderKey(headerRow[i]));
    }

    rows = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        return;
      }

      const item = {};
      headers.forEach((header, idx) => {
        item[header] = row.getCell(idx + 1).value ?? "";
      });
      rows.push(item);
    });
  } else {
    throw httpError(400, "Unsupported file format. Use CSV or Excel files");
  }

  const result = {
    fileName: originalName,
    totalRows: rows.length,
    imported: 0,
    failed: 0,
    errors: [],
  };

  for (let i = 0; i < rows.length; i += 1) {
    const rowNum = i + 2;

    try {
      const row = normalizeRow(rows[i]);

      if (!row.uid || !row.name || !row.subject_code || !row.subject_name || !row.grade) {
        throw new Error("uid, name, subject_code, subject_name and grade are required");
      }

      if (!Number.isFinite(row.credits) || row.credits <= 0) {
        throw new Error("credits must be a positive number");
      }

      if (!Number.isFinite(row.grade_points) || row.grade_points < 0 || row.grade_points > 10) {
        throw new Error("grade_points must be between 0 and 10");
      }

      const studentId = await upsertStudent(row.uid, row.name, row.cgpa);
      if (!studentId) {
        throw new Error(`Unable to upsert student '${row.uid}'`);
      }

      const subjectId = await upsertSubject(row.subject_code, row.subject_name, row.credits);
      if (!subjectId) {
        throw new Error(`Unable to upsert subject '${row.subject_code}'`);
      }

      await upsertResult({
        student_id: studentId,
        subject_id: subjectId,
        internal_marks: row.internal_marks,
        external_marks: row.external_marks,
        grade: row.grade,
        grade_points: row.grade_points,
      });

      result.imported += 1;
    } catch (err) {
      result.failed += 1;
      result.errors.push({ row: rowNum, message: err.message });
    }
  }

  return result;
}
