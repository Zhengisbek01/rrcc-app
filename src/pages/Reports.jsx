import { useEffect, useMemo, useState } from "react";
import { api } from "../apiClient";
import { formatMoney, STATUS_LABELS, DOC_STATUS_LABELS } from "../lib/statuses";

export default function Reports() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(7);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { requests } = await api.get("/requests");
      const since = Date.now() - range * 24 * 3600 * 1000;
      setRows((requests || []).filter((r) => new Date(r.created_at).getTime() >= since));
      setLoading(false);
    }
    load();
  }, [range]);

  const summary = useMemo(() => {
    const total = rows.reduce((s, r) => s + Number(r.paid_amount || r.amount || 0), 0);
    const provided = [...new Set(rows.filter((r) => r.documents_received).map((r) => r.contractor_name))];
    const overdue = [...new Set(rows.filter((r) => r.documents_status === "documents_overdue").map((r) => r.contractor_name))];
    const pendingCount = rows.filter((r) => r.documents_status === "documents_pending").length;
    return { total, provided, overdue, pendingCount };
  }, [rows]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-24 space-y-4">
      <div className="flex gap-2">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setRange(d)}
            className={`px-3 py-1.5 rounded-full text-xs border ${
              range === d ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-500"
            }`}
          >
            {d} дней
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-500">Заявок</div>
          <div className="text-xl font-semibold text-gray-900">{rows.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-500">Сумма</div>
          <div className="text-xl font-semibold text-gray-900">{formatMoney(summary.total)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-500">Документы получены</div>
          <div className="text-sm text-gray-700 mt-1">{summary.provided.join(", ") || "—"}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-gray-500">Просрочили документы</div>
          <div className="text-sm text-red-600 mt-1">{summary.overdue.join(", ") || "—"}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-left p-2.5">Объект</th>
              <th className="text-left p-2.5">Подрядчик</th>
              <th className="text-right p-2.5">Сумма</th>
              <th className="text-left p-2.5">Статус</th>
              <th className="text-left p-2.5">Документы</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-gray-50">
                <td className="p-2.5">{r.object_name}</td>
                <td className="p-2.5">{r.contractor_name}</td>
                <td className="p-2.5 text-right">{formatMoney(r.amount)}</td>
                <td className="p-2.5">{STATUS_LABELS[r.status]}</td>
                <td className="p-2.5">{r.documents_status ? DOC_STATUS_LABELS[r.documents_status] : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Нет данных за период</p>}
      </div>
      <p className="text-xs text-gray-400">
        Такой же отчёт автоматически рассылается всем пользователям в Telegram и внутри приложения каждую пятницу.
      </p>
    </div>
  );
}
