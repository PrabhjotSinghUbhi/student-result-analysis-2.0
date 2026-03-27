import { useEffect, useState } from "react";
import { createSubject, deleteSubject, fetchSubjects } from "../api/subjectApi";
import { DataTable } from "../components/DataTable";

const initialForm = {
  subject_code: "",
  subject_name: "",
  credits: 3,
};

export function SubjectsPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchSubjects();
      setRows(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load subjects");
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
      await createSubject({
        ...form,
        credits: Number(form.credits),
      });
      setForm(initialForm);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create subject");
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Delete this subject?")) {
      return;
    }

    try {
      await deleteSubject(id);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete subject");
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-3xl font-bold text-slate-900">Subjects</h2>
        <p className="text-slate-600">Manage subjects and credits based on uploaded sheets.</p>
      </div>

      <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 md:grid-cols-4">
        <input
          className="rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Subject Code"
          value={form.subject_code}
          onChange={(e) => setForm((s) => ({ ...s, subject_code: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Subject Name"
          value={form.subject_name}
          onChange={(e) => setForm((s) => ({ ...s, subject_name: e.target.value }))}
          required
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Credits"
          type="number"
          min="1"
          value={form.credits}
          onChange={(e) => setForm((s) => ({ ...s, credits: e.target.value }))}
          required
        />
        <div className="flex gap-2">
          <button type="submit" className="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700">
            Add
          </button>
        </div>
      </form>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="text-slate-600">Loading subjects...</p> : null}

      <DataTable
        columns={[
          { key: "subject_code", label: "Code" },
          { key: "subject_name", label: "Subject" },
          { key: "credits", label: "Credits" },
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
        emptyText="No subjects yet"
      />
    </div>
  );
}
