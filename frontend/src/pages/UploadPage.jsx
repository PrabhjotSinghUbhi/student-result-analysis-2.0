import { useRef, useState } from "react";
import { uploadResults } from "../api/uploadApi";

const allowedExtensions = [".csv", ".xlsx", ".xls"];

function validFile(file) {
  const lower = file.name.toLowerCase();
  return allowedExtensions.some((ext) => lower.endsWith(ext));
}

export function UploadPage() {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleFile(file) {
    if (!file) {
      return;
    }

    if (!validFile(file)) {
      setError("Invalid file type. Upload CSV or Excel files only.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data = await uploadResults(file);
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-3xl font-bold text-slate-900">Bulk Upload Results</h2>
        <p className="text-slate-600">
          Upload CSV/Excel with columns: Subject Code, Subject Name, Internal, External, Credits, Grade,
          UID, Name, Grade Points, CGPA.
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            inputRef.current?.click();
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        className={`rounded-2xl border-2 border-dashed p-10 text-center transition ${
          dragOver ? "border-teal-500 bg-teal-50" : "border-slate-300 bg-white/90"
        }`}
      >
        <input
          ref={inputRef}
          className="hidden"
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <p className="font-display text-xl font-semibold text-slate-800">Drop your file here</p>
        <p className="mt-1 text-sm text-slate-500">or click to browse</p>
      </div>

      {loading ? <p className="text-slate-600">Uploading and validating...</p> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      {result ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-soft">
          <h3 className="font-display text-lg font-semibold text-slate-900">Upload Summary</h3>
          <p className="text-sm text-slate-700">File: {result.fileName}</p>
          <p className="text-sm text-slate-700">Total Rows: {result.totalRows}</p>
          <p className="text-sm text-emerald-700">Imported: {result.imported}</p>
          <p className="text-sm text-rose-700">Failed: {result.failed}</p>

          {result.errors?.length ? (
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Validation Errors</p>
              <ul className="max-h-56 space-y-1 overflow-auto text-sm text-rose-700">
                {result.errors.map((err, idx) => (
                  <li key={idx}>
                    Row {err.row}: {err.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
