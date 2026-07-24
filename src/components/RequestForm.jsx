import { useEffect, useState } from "react";
import { api } from "../apiClient";

export default function RequestForm({ onCreated, onClose }) {
  const [objects, setObjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [contractors, setContractors] = useState([]);

  const [objectId, setObjectId] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/objects").then((d) => setObjects((d.objects || []).filter((o) => o.is_active)));
    api.get("/users").then((d) => setUsers(d.users || []));
    api.get("/contractors").then((d) => setContractors(d.contractors || []));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!objectId || !contractorName || !amount || !purpose || !responsibleId) {
      setError("Заполните все поля");
      return;
    }
    setBusy(true);
    try {
      const { contractor } = await api.post("/contractors", { name: contractorName.trim() });

      let photoUrl = null;
      if (file) {
        photoUrl = await api.uploadFile(file);
      }

      await api.post("/requests", {
        object_id: objectId,
        contractor_id: contractor.id,
        amount: Number(amount),
        purpose,
        responsible_user_id: responsibleId,
        invoice_photo_url: photoUrl,
      });

      onCreated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-30 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-5 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-900">Новая заявка на оплату</h2>
          <button onClick={onClose} className="text-gray-400 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={objectId}
            onChange={(e) => setObjectId(e.target.value)}
          >
            <option value="">Объект…</option>
            {objects.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>

          <input
            list="contractors-list"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="Подрядчик (компания)"
            value={contractorName}
            onChange={(e) => setContractorName(e.target.value)}
          />
          <datalist id="contractors-list">
            {contractors.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>

          <input
            type="number"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="Сумма по счёту, ₸"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <textarea
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="За что производится оплата"
            rows={2}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />

          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={responsibleId}
            onChange={(e) => setResponsibleId(e.target.value)}
          >
            <option value="">Ответственный сотрудник…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name}</option>
            ))}
          </select>

          <div>
            <label className="text-sm text-gray-500 block mb-1">Фото счёта / документа</label>
            <input
              type="file"
              accept="image/*,.pdf"
              capture="environment"
              onChange={(e) => setFile(e.target.files[0])}
              className="text-sm"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg py-2.5 text-sm font-medium"
          >
            {busy ? "Отправка…" : "Отправить на согласование"}
          </button>
        </form>
      </div>
    </div>
  );
}
