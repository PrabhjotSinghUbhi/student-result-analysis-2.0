import * as reportService from "../services/reportService.js";

export async function downloadStudentCsv(req, res) {
  const studentId = Number(req.params.studentId);
  const csv = await reportService.buildStudentCsv(studentId);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=student-${studentId}-report.csv`);
  res.send(csv);
}

export async function downloadStudentPdf(req, res) {
  const studentId = Number(req.params.studentId);
  const pdfBuffer = await reportService.buildStudentPdf(studentId);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=student-${studentId}-report.pdf`);
  res.send(pdfBuffer);
}
