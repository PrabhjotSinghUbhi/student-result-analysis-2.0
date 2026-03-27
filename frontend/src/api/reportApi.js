const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function reportCsvUrl(studentId) {
  return `${base}/reports/students/${studentId}/csv`;
}

export function reportPdfUrl(studentId) {
  return `${base}/reports/students/${studentId}/pdf`;
}
