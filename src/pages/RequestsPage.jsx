import { useEffect, useState, useCallback } from "react";
import { api } from "../apiClient";
import { useAuth } from "../context/AuthContext";
import RequestCard from "../components/RequestCard";
import RequestForm from "../components/RequestForm";
import { STATUS_LABELS } from "../lib/statuses";

const FILTERS_BY_ROLE = {
  site_manager: ["all", "pending_director", "approved", "awaiting_documents", "closed", "rejected"],
  director: ["pending_director", "approved", "rejected", "all"],
  accountant: ["approved", "awaiting_documents", "closed", "all"],
};

export default function RequestsPage() {
  const { role } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState(role === "director" ? "pending_director" : "all");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const query = filter !== "all" ? `?status=${filter}` : "";
    const { requests } = await api.get(`/requests${query}`);
    setRequests(requests || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const filters = FILTERS_BY_ROLE[role] || ["all"];

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-24">
      <div className="flex gap-2 overflow-x-auto pb-3">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border ${
              filter === f ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-500"
            }`}
          >
            {f === "all" ? "Все" : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-gray-400">Загрузка…</p>}
      {!loading && requests.length === 0 && (
        <p className="text-sm text-gray-400 py-10 text-center">Заявок нет</p>
      )}

      <div className="space-y-3">
        {requests.map((r) => (
          <RequestCard key={r.id} request={r} role={role} onChanged={load} />
        ))}
      </div>

      {role === "site_manager" && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-6 right-6 bg-brand-600 hover:bg-brand-700 text-white rounded-full w-14 h-14 text-2xl shadow-lg flex items-center justify-center"
        >
          +
        </button>
      )}

      {showForm && (
        <RequestForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}
