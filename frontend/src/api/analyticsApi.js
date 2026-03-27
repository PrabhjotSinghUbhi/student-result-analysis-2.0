import { http } from "../lib/http";

export async function fetchDashboardStats(semester) {
  const { data } = await http.get("/analytics/dashboard", {
    params: semester ? { semester } : {},
  });
  return data;
}

export async function fetchStudentTrend(studentId) {
  const { data } = await http.get(`/analytics/students/${studentId}/trend`);
  return data;
}
