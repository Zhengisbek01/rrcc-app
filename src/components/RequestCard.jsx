import { useState } from "react";
import { api } from "../apiClient";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  DOC_STATUS_LABELS,
  DOC_STATUS_COLORS,
  DOCUMENT_TYPES,
  formatMoney,
  formatDate,
} from "../lib/statuses";

export default function RequestCard({ request, role, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState("");
  const [paidAmount, setPaidAmount] = useState(request.amount);
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [docs, setDocs] = useState([]);
  const [deadline, setDeadline] = useState("");
  const [showAccountantForm, setShowAccountantForm] = useState(false);
  const [error, setError] = useState("");

  async function decide(decision) {
    setBusy(true);
    setError("");
    try {
      await api.post(`/requests?id=${request.id}&action=decide`, { decision, comment: comment || null });
      onChanged?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function markPaid() {
    if (docs.length === 0 || !deadline) {
      setError("Укажите нужные документы и срок предоставления");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.post(`/requests?id=${request.id}&action=pay`, {
        paid_amount: Number(paidAmount),
        paid_at: paidAt,
        required_documents: docs,
        document_deadline: deadline,
      });
      setShowAccountantForm(false);
      onChanged?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function markDocsReceived() {
    setBusy(true);
    setError("");
    try {
      await api.post(`/requests?id=${request.id}&action=documents-received`);
      onChanged?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function toggleDoc(d) {
    setDocs((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2 shadow-sm">
      <div className="flex justify-between items-start gap-2">
        <div>
          <div className="font-medium text-gray-900">{request.object_name}</div>
          <div className="text-sm text-gray-500">{request.contractor_name}</div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[request.status]}`}>
          {STATUS_LABELS[request.status]}
        </span>
      </div>

      <div className="text-lg font-semibold text-gray-900">{formatMoney(request.amount)}</div>
      <div className="text-sm text-gray-600">{request.purpose}</div>
      <div className="text-xs text-gray-500">Ответственный: {request.responsible_name}</div>
      <div className="text-xs text-gray-400">Создана: {request.created_by_name} · {formatDate(request.created_at)}</div>

      {request.invoice_photo_url && (
        <a href={request.invoice_photo_url} target="_blank" rel="noreferrer" className="inline-block">
          <img src={request.invoice_photo_url} alt="Счёт" className="h-24 rounded-lg border border-gray-200 object-cover" />
        </a>
      )}

      {request.documents_status && (
        <div className="flex items-center gap-2 pt-1">
          <span className={`text-xs px-2 py-1 rounded-full ${DOC_STATUS_COLORS[request.documents_status]}`}>
            {DOC_STATUS_LABELS[request.documents_status]}
          </span>
          {request.document_deadline && (
            <span className="text-xs text-gray-400">до {formatDate(request.document_deadline)}</span>
          )}
        </div>
      )}
      {request.required_documents?.length > 0 && (
        <div className="text-xs text-gray-500">Нужны: {request.required_documents.join(", ")}</div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {role === "director" && request.status === "pending_director" && (
        <div className="pt-2 space-y-2 border-t border-gray-100">
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
            placeholder="Комментарий (необязательно)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={() => decide("approved")}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2 text-sm font-medium"
            >
              Одобрить
            </button>
            <button
              disabled={busy}
              onClick={() => decide("rejected")}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-medium"
            >
              Отказать
            </button>
          </div>
        </div>
      )}

      {role === "accountant" && request.status === "approved" && !showAccountantForm && (
        <button
          onClick={() => setShowAccountantForm(true)}
          className="w-full mt-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-2 text-sm font-medium"
        >
          Отметить оплату
        </button>
      )}

      {role === "accountant" && showAccountantForm && (
        <div className="pt-2 space-y-2 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder="Сумма оплаты"
            />
            <input
              type="date"
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
            />
          </div>
          <div className="text-xs text-gray-500 mb-1">Какие документы нужно получить:</div>
          <div className="flex flex-wrap gap-1.5">
            {DOCUMENT_TYPES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDoc(d)}
                className={`text-xs px-2.5 py-1 rounded-full border ${
                  docs.includes(d) ? "bg-brand-600 text-white border-brand-600" : "border-gray-200 text-gray-600"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <input
            type="date"
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <button
            disabled={busy}
            onClick={markPaid}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2 text-sm font-medium"
          >
            Подтвердить оплату
          </button>
        </div>
      )}

      {role === "accountant" && request.status === "awaiting_documents" && (
        <button
          disabled={busy}
          onClick={markDocsReceived}
          className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white rounded-lg py-2 text-sm font-medium"
        >
          Документы получены
        </button>
      )}
    </div>
  );
}
