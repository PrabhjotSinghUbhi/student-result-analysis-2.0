import PDFDocument from "pdfkit";
import { stringify } from "csv-stringify/sync";
import { query } from "../db/pool.js";

async function getStudentReportRows(studentId) {
  const { rows } = await query(
    `SELECT
      st.uid,
      st.name,
      st.cgpa,
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
    WHERE r.student_id = ?
    ORDER BY sb.subject_code ASC`,
    [studentId]
  );

  return rows;
}

export async function buildStudentCsv(studentId) {
  const rows = await getStudentReportRows(studentId);
  if (!rows.length) {
    return "";
  }

  return stringify(rows, {
    header: true,
    columns: [
      "uid",
      "name",
      "cgpa",
      "subject_code",
      "subject_name",
      "credits",
      "internal_marks",
      "external_marks",
      "total_marks",
      "grade",
      "grade_points",
    ],
  });
}

export async function buildStudentPdf(studentId) {
  const rows = await getStudentReportRows(studentId);

  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(18).text("Student Performance Report", { underline: true });
    doc.moveDown();

    if (!rows.length) {
      doc.fontSize(12).text("No results found for this student.");
      doc.end();
      return;
    }

    const header = rows[0];
    doc.fontSize(12).text(`Name: ${header.name}`);
    doc.text(`UID: ${header.uid}`);
    doc.text(`CGPA: ${header.cgpa ?? "N/A"}`);
    doc.moveDown();

    rows.forEach((row, index) => {
      doc
        .fontSize(10)
        .text(
          `${index + 1}. ${row.subject_code} - ${row.subject_name} | Internal: ${row.internal_marks ?? "-"} | External: ${row.external_marks ?? "-"} | Total: ${row.total_marks ?? "-"} | ${row.grade} (${row.grade_points})`
        );
    });

    doc.end();
  });
}
