import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import RecoverPassword from "./pages/auth/RecoverPassword";
import PrivateRoute from "./routes/PrivateRoute";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import Usuarios from "./pages/Usuarios/Usuarios";
import MinhaConta from "./pages/MinhaConta/MinhaConta";
import CriarSenha from "./pages/auth/CriarSenha";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-senha" element={<RecoverPassword />} />
        <Route path="/criar-senha" element={<CriarSenha />} />

        {/* protegidas */}
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

        {/* fallback */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Router>
  );
}
