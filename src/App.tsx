import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import RecoverPassword from "./pages/auth/RecoverPassword";
import PrivateRoute from "./routes/PrivateRoute";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import Usuarios from "./pages/Usuarios/Usuarios";
import MinhaConta from "./pages/MinhaConta/MinhaConta";
import ClientDashboard from "./pages/client/Dashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* === Rotas públicas === */}
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-senha" element={<RecoverPassword />} />

        {/* === Painel ADMIN (todas as subrotas usam o mesmo layout) === */}
        <Route
          path="/admin"
          element={
            <PrivateRoute allowedDomain="@mendoncagalvao.com.br">
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="minha-conta" element={<MinhaConta />} />
          <Route
            path="usuarios"
            element={
              <PrivateRoute allowedRoles={["admin", "gestor"]}>
                <Usuarios />
              </PrivateRoute>
            }
          />
        </Route>

        {/* === Painel CLIENTE === */}
        <Route
          path="/cliente"
          element={
            <PrivateRoute>
              <ClientDashboard />
            </PrivateRoute>
          }
        />

        {/* === Fallback === */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}
