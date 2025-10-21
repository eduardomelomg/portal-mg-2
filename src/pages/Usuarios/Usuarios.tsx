import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../services/supabase";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo: "admin" | "gestor" | "colaborador";
  ativo: boolean;
}

export default function Usuarios() {
  const { user, empresa, cargo } = useAuth();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [novoCargo, setNovoCargo] = useState<
    "admin" | "gestor" | "colaborador"
  >("colaborador");
  const [loading, setLoading] = useState(false);

  const podeGerenciar = cargo === "admin" || cargo === "gestor";

  // === LISTAR USUÁRIOS ===
  useEffect(() => {
    if (!empresa?.id) return;
    carregarUsuarios();
  }, [empresa?.id]);

  const carregarUsuarios = async () => {
    try {
      if (!empresa?.id) return;

      // 1️⃣ Busca vínculos da empresa
      const { data: vinculos, error: vinculoError } = await supabase
        .from("usuarios_empresas")
        .select("usuario_id, cargo, ativo")
        .eq("empresa_id", empresa.id);

      if (vinculoError) throw vinculoError;
      if (!vinculos || vinculos.length === 0) {
        setUsuarios([]);
        return;
      }

      // 2️⃣ Busca dados dos usuários no auth.users
      const userIds = vinculos.map((v) => v.usuario_id);
      const { data: users, error: usersError } =
        await supabase.auth.admin.listUsers();

      if (usersError) throw usersError;

      // 3️⃣ Combina as duas listas
      const lista = vinculos.map((v) => {
        const u = users.users.find((usr) => usr.id === v.usuario_id);
        return {
          id: v.usuario_id,
          email: u?.email ?? "—",
          nome:
            u?.user_metadata?.name ||
            u?.user_metadata?.full_name ||
            u?.email?.split("@")[0] ||
            "Usuário",
          cargo: v.cargo,
          ativo: v.ativo,
        };
      });

      setUsuarios(lista);
    } catch (e) {
      console.error("Erro ao carregar usuários:", e);
      alert("Erro ao carregar usuários.");
    }
  };

  // === CONVIDAR NOVO USUÁRIO ===
  const handleAddUsuario = async () => {
    if (!podeGerenciar) {
      alert("Apenas administradores e gestores podem adicionar usuários.");
      return;
    }

    if (!nome.trim() || !email.trim()) {
      alert("Preencha o nome e o e-mail do usuário.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/invite-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Erro ao convidar:", result.error);
        alert("Erro ao convidar usuário: " + result.error);
        setLoading(false);
        return;
      }

      // === Vincula usuário à empresa no Supabase ===
      // aguarda o usuário ser criado (pode demorar 1-2s)
      setTimeout(async () => {
        const { data: novoUsuario } = await supabase
          .from("auth.users")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (novoUsuario) {
          await supabase.from("usuarios_empresas").insert({
            usuario_id: novoUsuario.id,
            empresa_id: empresa?.id,
            cargo: novoCargo,
            ativo: true,
          });
        }

        alert("✅ Convite enviado com sucesso!");
        setNome("");
        setEmail("");
        carregarUsuarios();
      }, 1500);
    } catch (error) {
      console.error("Erro inesperado:", error);
      alert("Erro inesperado ao convidar usuário.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-white space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Gestão de Usuários</h1>
        <p className="text-gray-400">
          Gerencie os usuários vinculados à sua empresa.
        </p>
      </div>

      {/* === FORMULÁRIO DE NOVO USUÁRIO === */}
      {podeGerenciar && (
        <section className="bg-[#2b2f33] p-6 rounded-lg space-y-4">
          <h2 className="text-xl font-semibold">Convidar Novo Usuário</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-[#1c1f22] border border-gray-700 rounded-md p-2"
                placeholder="Ex: João Silva"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1c1f22] border border-gray-700 rounded-md p-2"
                placeholder="usuario@empresa.com"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Cargo</label>
              <select
                value={novoCargo}
                onChange={(e) =>
                  setNovoCargo(
                    e.target.value as "admin" | "gestor" | "colaborador"
                  )
                }
                className="w-full bg-[#1c1f22] border border-gray-700 rounded-md p-2"
              >
                {cargo === "admin" && (
                  <option value="admin">Administrador</option>
                )}
                <option value="gestor">Gestor</option>
                <option value="colaborador">Colaborador</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleAddUsuario}
            disabled={loading}
            className="mt-4 bg-yellow-600 text-black px-4 py-2 rounded-md font-semibold hover:bg-yellow-500 disabled:opacity-50"
          >
            {loading ? "Enviando convite..." : "Enviar Convite"}
          </button>
        </section>
      )}

      {/* === LISTAGEM DE USUÁRIOS === */}
      <section className="bg-[#2b2f33] p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold">Usuários Ativos</h2>

        {usuarios.length === 0 ? (
          <p className="text-gray-400">Nenhum usuário encontrado.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="py-2">Nome</th>
                <th className="py-2">E-mail</th>
                <th className="py-2">Cargo</th>
                <th className="py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-gray-800">
                  <td className="py-2">{u.nome}</td>
                  <td className="py-2">{u.email}</td>
                  <td className="py-2 capitalize">{u.cargo}</td>
                  <td className="py-2 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        u.ativo
                          ? "bg-green-700 text-green-100"
                          : "bg-gray-600 text-gray-300"
                      }`}
                    >
                      {u.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
