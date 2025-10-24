import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";

interface Usuario {
  id: string;
  email: string;
  nome?: string;
  cargo?: string;
  empresa_id?: string;
  empresa_nome?: string;
  created_at?: string;
}

export default function Usuarios() {
  const { cargo, empresa } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // ✅ Usa apenas localhost para o backend
  const API_URL = "http://localhost:5051";

  // Novo usuário (para convites)
  const [novoUsuario, setNovoUsuario] = useState({
    nome: "",
    email: "",
    cargo: "colaborador",
  });

  const podeCriar = cargo === "admin" || cargo === "gestor";

  // === Carrega usuários ===
  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (cargo) params.append("cargo", cargo);
      if (empresa?.id) params.append("empresaId", empresa.id);
      if (search) params.append("search", search);

      const res = await fetch(`${API_URL}/api/users?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao buscar usuários");

      const data = await res.json();
      setUsuarios(data.usuarios || []);
    } catch (err: any) {
      console.error("❌ Erro ao carregar usuários:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // === Convida novo usuário ===
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
      console.error("❌ Erro ao convidar usuário:", err.message);
      alert(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Atualiza lista quando o search muda
  useEffect(() => {
    const timeout = setTimeout(() => {
      carregarUsuarios();
    }, 500);
    return () => clearTimeout(timeout);
  }, [search]);

  // Carrega usuários ao montar
  useEffect(() => {
    carregarUsuarios();
  }, []);

  return (
    <div className="text-white space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold">Usuários</h1>
        <p className="text-gray-400">
          Gerencie os usuários da sua empresa e envie novos convites
        </p>
      </div>

      {/* Novo usuário */}
      {podeCriar && (
        <section className="bg-[#2b2f33] p-6 rounded-lg space-y-4">
          <h2 className="text-xl font-semibold">Convidar Novo Usuário</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">Nome</label>
              <input
                type="text"
                value={novoUsuario.nome}
                onChange={(e) =>
                  setNovoUsuario({ ...novoUsuario, nome: e.target.value })
                }
                className="w-full bg-[#1c1f22] border border-gray-700 rounded-md p-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">E-mail</label>
              <input
                type="email"
                value={novoUsuario.email}
                onChange={(e) =>
                  setNovoUsuario({ ...novoUsuario, email: e.target.value })
                }
                className="w-full bg-[#1c1f22] border border-gray-700 rounded-md p-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Cargo</label>
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

      {/* Lista de usuários */}
      <section className="bg-[#2b2f33] p-6 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Lista de Usuários</h2>
          <input
            type="text"
            placeholder="Pesquisar usuários..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#1c1f22] border border-gray-700 rounded-md p-2 w-64 text-sm"
          />
        </div>

        {loading && <p className="text-gray-400">Carregando usuários...</p>}
        {error && <p className="text-red-500">Erro: {error}</p>}
        {!loading && usuarios.length === 0 && (
          <p className="text-gray-400">Nenhum usuário encontrado.</p>
        )}

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
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-[#383c41]">
                  <td className="p-3 border-b border-gray-700">
                    {u.nome || "—"}
                  </td>
                  <td className="p-3 border-b border-gray-700">{u.email}</td>
                  <td className="p-3 border-b border-gray-700">
                    {u.cargo || "—"}
                  </td>
                  <td className="p-3 border-b border-gray-700">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
