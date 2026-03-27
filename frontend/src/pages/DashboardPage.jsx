import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchDashboardStats } from "../api/analyticsApi";
import { ChartCard } from "../components/ChartCard";
import { DataTable } from "../components/DataTable";
import { StatCard } from "../components/StatCard";

const bellColors = ["#f97316", "#eab308", "#84cc16", "#22c55e", "#14b8a6", "#06b6d4", "#0ea5e9"];

export function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const response = await fetchDashboardStats();
      setData(response);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-bold text-slate-900">Analytics Dashboard</h2>
          <p className="text-slate-600">Grade distribution, pass rates, score curve, and at-risk students.</p>
        </div>

        <button
          type="button"
          onClick={load}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          Refresh
        </button>
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="text-slate-600">Loading dashboard...</p> : null}

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Students" value={data.summary.students_count || 0} />
            <StatCard label="Subjects" value={data.summary.subjects_count || 0} />
            <StatCard label="Average Grade Points" value={data.summary.avg_grade_points || 0} />
            <StatCard label="Average CGPA" value={data.summary.avg_cgpa || 0} />
            <StatCard label="Average Internal" value={data.summary.avg_internal || 0} />
            <StatCard label="Average External" value={data.summary.avg_external || 0} />
            <StatCard label="Overall Pass Rate" value={`${data.insights?.overall_pass_rate || 0}%`} />
            <StatCard
              label="Toughest Subject"
              value={data.insights?.toughest_subject?.subject_code || "N/A"}
              hint={data.insights?.toughest_subject?.subject_name || ""}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Total Score Curve">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.bellCurve || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bucket" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {(data.bellCurve || []).map((entry, index) => (
                      <Cell key={entry.bucket} fill={bellColors[index % bellColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Grade Distribution">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.gradeDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bucket" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0d7f7d" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Subject-wise Pass Rate">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.passRateBySubject || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject_code" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="pass_rate" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Average Grade Points By Subject">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.subjectMetrics || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject_code" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Bar dataKey="avg_grade_points" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <DataTable
            columns={[
              { key: "uid", label: "UID" },
              { key: "name", label: "Name" },
              { key: "avg_grade_points", label: "Avg Grade Points" },
              { key: "low_grade_subjects", label: "Low-Grade Subjects" },
            ]}
            rows={data.atRisk}
            emptyText="No at-risk students for the selected scope"
          />

          <DataTable
            columns={[
              { key: "subject_code", label: "Subject Code" },
              { key: "subject_name", label: "Subject Name" },
              { key: "avg_internal", label: "Avg Internal" },
              { key: "avg_external", label: "Avg External" },
              { key: "avg_total", label: "Avg Total" },
              { key: "avg_grade_points", label: "Avg Grade Points" },
              { key: "pass_rate", label: "Pass Rate %" },
              { key: "high_achievers", label: "High Achievers" },
              { key: "low_achievers", label: "Low Achievers" },
            ]}
            rows={data.subjectMetrics || []}
            emptyText="No subject metrics yet"
          />

          <DataTable
            columns={[
              { key: "uid", label: "UID" },
              { key: "name", label: "Name" },
              { key: "cgpa", label: "CGPA" },
              { key: "weighted_grade_points", label: "Weighted Grade Points" },
              { key: "avg_total", label: "Avg Total" },
              { key: "high_grades_count", label: "High Grades" },
              { key: "subjects_count", label: "Subjects" },
            ]}
            rows={data.topStudents || []}
            emptyText="No student insights yet"
          />
        </>
      ) : null}
    </div>
  );
}
