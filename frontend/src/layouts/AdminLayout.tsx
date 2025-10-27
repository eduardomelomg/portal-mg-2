import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import DebugOverlay from "../components/DebugOverlay";

export default function AdminLayout() {
  const { user, empresa, authChecked, signOut } = useAuth();
  const { pathname } = useLocation();

  // enquanto não confirmamos com o Supabase, não renderiza shell nenhum
  if (!authChecked) return null;

  // se authChecked=true mas user=null, PrivateRoute já redirecionou;
  // este return aqui é só uma cinta-liga caso usem AdminLayout fora do guard.
  if (!user) return null;

  const tituloEmpresa = empresa?.nome ?? "Carregando…";
  const cnpj = empresa?.cnpj ?? "00.000.000/0000-00";

  return (
    <div className="min-h-screen bg-[#111417] text-slate-100">
      {/* Topbar */}
      <header className="w-full bg-[#1b1f24] border-b border-[#2a2f35]">
        <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="font-semibold">
              Painel
            </Link>
            <span className="text-slate-500">/</span>
            <span className="text-slate-300 truncate max-w-[42vw]">
              {tituloEmpresa}
            </span>
            <span className="text-slate-500">—</span>
            <span className="text-slate-500">{cnpj}</span>
          </div>
          {/* user dropdown simplificado */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium leading-4">{user.nome}</div>
              <div className="text-xs text-slate-400">{user.email}</div>
            </div>
            <button
              onClick={signOut}
              className="text-xs bg-red-600/90 hover:bg-red-600 px-3 py-1 rounded"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar + conteúdo (simplificado) */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <nav className="mb-4 flex gap-4 text-sm">
          <Link className={linkCls(pathname === "/admin")} to="/admin">
            Dashboard
          </Link>
          <Link className={linkCls(pathname.startsWith("/admin/usuarios"))} to="/admin/usuarios">
            Usuários
          </Link>
          <Link className={linkCls(pathname.startsWith("/admin/minha-conta"))} to="/admin/minha-conta">
            Minha Conta
          </Link>
        </nav>
        <Outlet />
      </div>

      {/* ⬇️ remova quando terminar de depurar */}
      <DebugOverlay />
    </div>
  );
}

function linkCls(active: boolean) {
  return (
    "px-3 py-1 rounded " +
    (active ? "bg-yellow-600 text-black" : "bg-[#1b1f24] text-slate-300 hover:bg-[#232931]")
  );
}