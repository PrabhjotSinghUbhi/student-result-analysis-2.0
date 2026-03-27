export function StatCard({ label, value, hint }) {
  return (
    <div className="reveal rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-soft">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
