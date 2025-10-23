import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";

interface Usuario {
  id: string;
  email: string;
  nome: string;
  cargo: string;
  empresa_id?: string | null;
  empresa_nome?: string;
  created_at?: string;
}

interface EmpresaGroup {
  empresa_id: string | null;
  empresa_nome: string;
  usuarios: Usuario[];
}

export default function Usuarios() {
  const { cargo, empresa } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const API_URL = process.env.VITE_API_URL || "http://localhost:5000";

  const podeCriar = cargo === "admin" || cargo === "gestor";

  // === Carrega usuários ===
  const carregarUsuarios = async () => {
    if (!cargo) return; // ⚠️ Garante que só busca quando já tiver cargo definido

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("cargo", cargo);
      if (empresa?.id) params.append("empresaId", empresa.id);
      if (debouncedSearch) params.append("search", debouncedSearch);

      const res = await fetch(`${API_URL}/api/users?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao buscar usuários");

      if (cargo === "admin") {
        setEmpresas(data.empresas || []);
        setUsuarios([]);
      } else {
        setUsuarios(data.users || []);
        setEmpresas([]);
      }
    } catch (err: any) {
      console.error("Erro ao carregar usuários:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cargo) carregarUsuarios(); // ⚠️ Só busca quando cargo estiver pronto
  }, [cargo, empresa?.id, debouncedSearch]);

  const [novoUsuario, setNovoUsuario] = useState({
    nome: "",
    email: "",
    cargo: "colaborador",
  });

  const handleAddUsuario = async () => {
    if (!novoUsuario.nome || !novoUsuario.email) {
      alert("Preencha nome e e-mail.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_URL}/api/invite-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...novoUsuario,
          empresaId: empresa?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao convidar usuário");

      alert("✅ Convite enviado com sucesso!");
      setNovoUsuario({ nome: "", email: "", cargo: "colaborador" });
      carregarUsuarios();
    } catch (err: any) {
      console.error("Erro ao convidar usuário:", err.message);
      alert(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderUsuarioRow = (u: Usuario) => (
    <tr key={u.id} className="hover:bg-[#383c41]">
      <td className="p-3 border-b border-gray-700">{u.nome || "—"}</td>
      <td className="p-3 border-b border-gray-700">{u.email}</td>
      <td className="p-3 border-b border-gray-700">{u.cargo || "—"}</td>
      <td className="p-3 border-b border-gray-700">
        {u.created_at
          ? new Date(u.created_at).toLocaleDateString("pt-BR")
          : "—"}
      </td>
    </tr>
  );

  return (
    <div className="text-white space-y-8">
      {/* Cabeçalho */}
      <header>
        <h1 className="text-2xl font-bold">Usuários</h1>
        <p className="text-gray-400">
          Gerencie os usuários da sua empresa e envie novos convites
        </p>
      </header>

      {/* Novo usuário */}
      {podeCriar && (
        <section className="bg-[#2b2f33] p-6 rounded-lg space-y-4">
          <h2 className="text-xl font-semibold">Convidar Novo Usuário</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Nome"
              value={novoUsuario.nome}
              onChange={(e) =>
                setNovoUsuario({ ...novoUsuario, nome: e.target.value })
              }
              className="w-full bg-[#1c1f22] border border-gray-700 rounded-md p-2"
            />
            <input
              type="email"
              placeholder="E-mail"
              value={novoUsuario.email}
              onChange={(e) =>
                setNovoUsuario({ ...novoUsuario, email: e.target.value })
              }
              className="w-full bg-[#1c1f22] border border-gray-700 rounded-md p-2"
            />
            <select
              value={novoUsuario.cargo}
              onChange={(e) =>
                setNovoUsuario({ ...novoUsuario, cargo: e.target.value })
              }
              className="w-full bg-[#1c1f22] border border-gray-700 rounded-md p-2"
            >
              <option value="colaborador">Colaborador</option>
              <option value="gestor">Gestor</option>
              {cargo === "admin" && <option value="admin">Admin</option>}
            </select>
          </div>

          <button
            onClick={handleAddUsuario}
            disabled={loading}
            className="bg-yellow-600 text-black px-4 py-2 rounded-md font-semibold hover:bg-yellow-500 disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Convidar Usuário"}
          </button>
        </section>
      )}

      {/* Lista */}
      <section className="bg-[#2b2f33] p-6 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Lista de Usuários</h2>
          {/* 🔍 Input de busca aqui */}
          <input
            type="text"
            placeholder="Pesquisar usuários..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#1c1f22] border border-gray-700 rounded-md p-2 w-64"
          />
        </div>

        {error && <p className="text-red-500">⚠️ {error}</p>}
        {loading && <p className="text-gray-400">Carregando...</p>}

        {/* === ADMIN === */}
        {cargo === "admin" &&
          !loading &&
          empresas.map((emp) => (
            <div key={emp.empresa_id} className="mb-8">
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                {emp.empresa_nome}
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-700 rounded-lg">
                  <thead>
                    <tr className="bg-[#1c1f22] text-left">
                      <th className="p-3 border-b border-gray-700">Nome</th>
                      <th className="p-3 border-b border-gray-700">E-mail</th>
                      <th className="p-3 border-b border-gray-700">Cargo</th>
                      <th className="p-3 border-b border-gray-700">
                        Data de Criação
                      </th>
                    </tr>
                  </thead>
                  <tbody>{emp.usuarios.map(renderUsuarioRow)}</tbody>
                </table>
              </div>
            </div>
          ))}

        {/* === GESTOR / COLABORADOR === */}
        {cargo !== "admin" && !loading && (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-700 rounded-lg">
              <thead>
                <tr className="bg-[#1c1f22] text-left">
                  <th className="p-3 border-b border-gray-700">Nome</th>
                  <th className="p-3 border-b border-gray-700">E-mail</th>
                  <th className="p-3 border-b border-gray-700">Cargo</th>
                  <th className="p-3 border-b border-gray-700">
                    Data de Criação
                  </th>
                </tr>
              </thead>
              <tbody>{usuarios.map(renderUsuarioRow)}</tbody>
            </table>
          </div>
        )}

        {!loading &&
          !error &&
          usuarios.length === 0 &&
          empresas.length === 0 && (
            <p className="text-gray-400">Nenhum usuário encontrado.</p>
          )}
      </section>
    </div>
  );
}
