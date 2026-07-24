import { useEffect, useState } from "react";
import { api } from "../apiClient";

export default function ObjectsPage() {
  const [objects, setObjects] = useState([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const { objects } = await api.get("/objects");
    setObjects(objects || []);
  }

  useEffect(() => { load(); }, []);

  async function addObject(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      await api.post("/objects", { name: name.trim(), address });
      setName("");
      setAddress("");
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(o) {
    await api.patch(`/objects?id=${o.id}`, { is_active: !o.is_active });
    load();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-24 space-y-4">
      <form onSubmit={addObject} className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
        <div className="font-medium text-gray-900 text-sm mb-1">Добавить объект</div>
        <input
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          placeholder="Название объекта"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          placeholder="Адрес (необязательно)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={busy}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-2 text-sm font-medium"
        >
          Добавить
        </button>
      </form>

      <div className="space-y-2">
        {objects.map((o) => (
          <div key={o.id} className="bg-white rounded-xl border border-gray-100 p-3 flex justify-between items-center">
            <div>
              <div className="font-medium text-gray-900 text-sm">{o.name}</div>
              <div className="text-xs text-gray-500">{o.address}</div>
            </div>
            <button
              onClick={() => toggleActive(o)}
              className={`text-xs px-3 py-1.5 rounded-full ${
                o.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {o.is_active ? "Активен" : "Архив"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
