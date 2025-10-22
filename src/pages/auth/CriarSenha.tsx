import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";

export default function CriarSenha() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    // Captura o e-mail do token enviado pelo Supabase
    const fetchSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) setEmail(data.user.email);
    };
    fetchSession();
  }, []);

  const handleCriarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (senha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) throw error;

      alert("✅ Senha criada com sucesso!");
      navigate("/login");
    } catch (err: any) {
      setErro(err.message || "Erro ao definir senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1c1f22] flex items-center justify-center text-white px-4">
      <div className="bg-[#2b2f33] p-8 rounded-lg shadow-lg w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Criar Senha</h1>
        <p className="text-gray-400 text-center">
          {email ? `Defina uma senha para a conta ${email}` : "Carregando..."}
        </p>

        <form onSubmit={handleCriarSenha} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Nova Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full bg-[#1c1f22] border border-gray-700 rounded-md p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Confirmar Senha</label>
            <input
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className="w-full bg-[#1c1f22] border border-gray-700 rounded-md p-2"
              required
            />
          </div>

          {erro && <p className="text-red-500 text-sm">{erro}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-600 text-black font-semibold rounded-md py-2 hover:bg-yellow-500 disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar Senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
