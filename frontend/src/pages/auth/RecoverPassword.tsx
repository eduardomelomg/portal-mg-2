import { useState } from "react";
import { supabase } from "../../services/supabase";
import { useNavigate } from "react-router-dom";

export default function RecoverPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRecover = async () => {
    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Informe seu e-mail para recuperar a senha.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/resetar-senha`,
    });

    if (error) {
      console.error(error);
      setError("Erro ao enviar o e-mail de recuperação.");
    } else {
      setMessage(
        "Um link de redefinição de senha foi enviado para o seu e-mail."
      );
    }
    setLoading(false);
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-[#1c1f22] text-white px-4">
      <div className="bg-[#2e3338] p-8 rounded-lg w-full max-w-md shadow-lg">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img src="/logo.png" alt="Logo" className="h-14" />
        </div>

        <h2 className="text-2xl font-semibold text-center mb-2">
          Recuperar Senha
        </h2>
        <p className="text-sm text-center mb-6 text-gray-300">
          Digite seu e-mail para receber o link de redefinição
        </p>

        {/* Input */}
        <div className="mb-4">
          <label htmlFor="email" className="text-sm block mb-1">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            placeholder="Digite seu e-mail"
            className="w-full p-2 rounded-md bg-black border border-gray-500 text-white placeholder-gray-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Mensagens */}
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        {message && <p className="text-green-400 text-sm mb-3">{message}</p>}

        {/* Botão */}
        <button
          onClick={handleRecover}
          disabled={loading}
          className={`w-full py-2 rounded-md font-semibold transition ${
            loading
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:opacity-90"
          }`}
        >
          {loading ? "Enviando..." : "Enviar link de recuperação"}
        </button>

        <p className="mt-6 text-center text-sm text-gray-400">
          <button
            onClick={() => navigate("/login")}
            className="underline hover:text-white"
          >
            Voltar ao login
          </button>
        </p>
      </div>
    </div>
  );
}
