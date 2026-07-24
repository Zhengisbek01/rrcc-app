import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../lib/statuses";

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("site_manager");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register({ email, password, full_name: fullName, role });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <img src="/logo.png" alt="ARR Construction" className="h-14 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 mb-1 text-center">Контроль оплат</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">Строительные объекты — заявки, согласование, документы</p>

        <div className="flex mb-5 rounded-lg bg-gray-100 p-1 text-sm">
          <button
            className={`flex-1 py-1.5 rounded-md transition ${mode === "login" ? "bg-white shadow-sm font-medium" : "text-gray-500"}`}
            onClick={() => setMode("login")}
            type="button"
          >
            Вход
          </button>
          <button
            className={`flex-1 py-1.5 rounded-md transition ${mode === "signup" ? "bg-white shadow-sm font-medium" : "text-gray-500"}`}
            onClick={() => setMode("signup")}
            type="button"
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="ФИО"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </>
          )}
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg py-2.5 text-sm font-medium transition"
          >
            {busy ? "Подождите…" : mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>
        </form>
      </div>
    </div>
  );
}
