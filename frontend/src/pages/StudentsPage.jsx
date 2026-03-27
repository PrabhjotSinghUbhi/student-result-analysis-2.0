import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createStudent, deleteStudent, fetchStudents } from "../api/studentApi";
import { DataTable } from "../components/DataTable";

const initialForm = {
  uid: "",
  name: "",
  cgpa: "",
};

export function StudentsPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchStudents();
      setRows(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");

    try {
      await createStudent({ ...form, cgpa: form.cgpa === "" ? null : Number(form.cgpa) });
      setForm(initialForm);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create student");
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Delete this student?")) {
      return;
    }

    try {
      await deleteStudent(id);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete student");
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-3xl font-bold text-slate-900">Students</h2>
        <p className="text-slate-600">Manage student records and profiles.</p>
      </div>

      <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 md:grid-cols-4">
        <input
          className="rounded-lg border border-slate-300 px-3 py-2"
          placeholder="UID"
          value={form.uid}
          onChange={(e) => setForm((s) => ({ ...s, uid: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2"
          placeholder="CGPA"
          type="number"
          min="0"
          max="10"
          step="0.01"
          value={form.cgpa}
          onChange={(e) => setForm((s) => ({ ...s, cgpa: e.target.value }))}
        />
        <div className="flex items-center">
          <button type="submit" className="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700">
            Add
          </button>
        </div>
      </form>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="text-slate-600">Loading students...</p> : null}

      <DataTable
        columns={[
          {
            key: "name",
            label: "Name",
            render: (row) => (
              <Link className="font-semibold text-teal-700 hover:underline" to={`/students/${row.id}`}>
                {row.name}
              </Link>
            ),
          },
          { key: "uid", label: "UID" },
          { key: "cgpa", label: "CGPA" },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <button
                type="button"
                className="rounded-md bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200"
                onClick={() => onDelete(row.id)}
              >
                Delete
              </button>
            ),
          },
        ]}
        rows={rows}
        emptyText="No student records yet"
      />
    </div>
  );
}
