import { useEffect, useState } from "react";
import { api } from "../apiClient";
import { useAuth } from "../context/AuthContext";

export default function NotificationsBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  async function load() {
    if (!user) return;
    try {
      const { notifications } = await api.get("/notifications");
      setItems(notifications || []);
    } catch {
      // тихо игнорируем — не критично
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const unread = items.filter((i) => !i.is_read).length;

  async function markAllRead() {
    setOpen((o) => !o);
    if (unread > 0) {
      await api.patch("/notifications");
      load();
    }
  }

  return (
    <div className="relative">
      <button onClick={markAllRead} className="relative p-1.5 rounded-full hover:bg-gray-100">
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-lg p-2 z-20">
          {items.length === 0 && <p className="text-sm text-gray-400 p-3">Уведомлений нет</p>}
          {items.map((n) => (
            <div key={n.id} className="p-2.5 rounded-lg hover:bg-gray-50 border-b border-gray-50 last:border-0">
              <div className="text-sm font-medium text-gray-900">{n.title}</div>
              <div className="text-xs text-gray-500 whitespace-pre-line mt-0.5">{n.body}</div>
              <div className="text-[10px] text-gray-400 mt-1">
                {new Date(n.created_at).toLocaleString("ru-RU")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
