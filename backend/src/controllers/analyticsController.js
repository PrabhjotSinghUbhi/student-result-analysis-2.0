import * as analyticsService from "../services/analyticsService.js";

export async function getDashboardStats(req, res) {
  const data = await analyticsService.getDashboardStats();
  res.json(data);
}

export async function getStudentTrend(req, res) {
  const data = await analyticsService.getStudentTrend(Number(req.params.studentId));
  res.json(data);
}
