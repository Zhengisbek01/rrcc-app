import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import RequestsPage from "./pages/RequestsPage";
import ObjectsPage from "./pages/ObjectsPage";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import Navbar from "./components/Navbar";

function Shell({ children }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      {children}
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Загрузка…</div>;
  }

  if (!user) return <Login />;

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<RequestsPage />} />
        <Route path="/objects" element={<ObjectsPage />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
