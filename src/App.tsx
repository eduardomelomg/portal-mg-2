import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/auth/Login";
import RecoverPassword from "./pages/auth/RecoverPassword";
import PrivateRoute from "./routes/PrivateRoute";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
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
          {/* Rota padrão (dashboard principal) */}
          <Route index element={<AdminDashboard />} />

          {/* Outras rotas do painel */}
          <Route path="minha-conta" element={<MinhaConta />} />
          {/* Exemplo futuro: */}
          {/* <Route path="empresas" element={<Empresas />} /> */}
          {/* <Route path="envios" element={<Envios />} /> */}
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
