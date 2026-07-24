import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../lib/statuses";
import NotificationsBell from "./NotificationsBell";

export default function Navbar() {
  const { profile, role, signOut } = useAuth();

  const tabs = [
    { to: "/", label: "Заявки" },
    { to: "/reports", label: "Отчёты" },
    { to: "/profile", label: "Профиль" },
  ];
  if (role === "director") tabs.splice(1, 0, { to: "/objects", label: "Объекты" });

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="ARR Construction" className="h-8 w-auto" />
          <div>
            <div className="font-semibold text-gray-900 leading-tight">Контроль оплат</div>
            <div className="text-xs text-gray-500">{profile?.full_name} · {ROLE_LABELS[role] || ""}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NotificationsBell />
          <button onClick={signOut} className="text-xs text-gray-400 hover:text-gray-600">Выйти</button>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 flex gap-1 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === "/"}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
                isActive ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
