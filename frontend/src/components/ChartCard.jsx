export function ChartCard({ title, children }) {
  return (
    <div className="reveal rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-soft">
      <h3 className="font-display text-lg font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 h-[280px]">{children}</div>
    </div>
  );
}
