import { AcademicCapIcon, ArrowUpTrayIcon, ChartBarSquareIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: ChartBarSquareIcon },
  { to: "/students", label: "Students", icon: UserGroupIcon },
  { to: "/subjects", label: "Subjects", icon: AcademicCapIcon },
  { to: "/upload", label: "Bulk Upload", icon: ArrowUpTrayIcon },
];

export function Layout({ children }) {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6 md:grid-cols-[250px_1fr]">
        <aside className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-soft backdrop-blur">
          <h1 className="font-display text-xl font-bold tracking-tight text-slate-900">
            Result Insight Hub
          </h1>
          <p className="mt-1 text-sm text-slate-500">Student Result Analysis System</p>

          <nav className="mt-6 space-y-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-teal-600 text-white"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}
