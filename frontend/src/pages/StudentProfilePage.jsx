import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchStudentTrend } from "../api/analyticsApi";
import { reportCsvUrl, reportPdfUrl } from "../api/reportApi";
import { fetchResults } from "../api/resultApi";
import { fetchStudentById } from "../api/studentApi";
import { DataTable } from "../components/DataTable";

export function StudentProfilePage() {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [trend, setTrend] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [studentRes, trendRes, resultRes] = await Promise.all([
        fetchStudentById(studentId),
        fetchStudentTrend(studentId),
        fetchResults({ studentId }),
      ]);

      setStudent(studentRes);
      setTrend(trendRes);
      setResults(resultRes);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load student profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [studentId]);

  return (
    <div className="space-y-5">
      {loading ? <p className="text-slate-600">Loading profile...</p> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      {student ? (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-soft">
            <h2 className="font-display text-3xl font-bold text-slate-900">{student.name}</h2>
            <p className="text-slate-700">UID: {student.uid} | CGPA: {student.cgpa ?? "N/A"}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700" href={reportCsvUrl(student.id)}>
                Download CSV
              </a>
              <a className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900" href={reportPdfUrl(student.id)}>
                Download PDF
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-soft">
            <h3 className="font-display text-lg font-semibold text-slate-900">Performance Trend</h3>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject_code" />
                  <YAxis yAxisId="left" domain={[0, 10]} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 120]} />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="grade_points" stroke="#0d7f7d" strokeWidth={3} />
                  <Line yAxisId="right" type="monotone" dataKey="total_marks" stroke="#f97316" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <DataTable
            columns={[
              { key: "uid", label: "UID", render: () => student.uid },
              { key: "subject_code", label: "Subject Code" },
              { key: "subject_name", label: "Subject Name" },
              { key: "internal_marks", label: "Internal" },
              { key: "external_marks", label: "External" },
              { key: "total_marks", label: "Total" },
              { key: "grade", label: "Grade" },
              { key: "grade_points", label: "Grade Points" },
            ]}
            rows={results}
            emptyText="No results recorded for this student"
          />
        </>
      ) : null}
    </div>
  );
}
