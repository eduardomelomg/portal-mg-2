import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { supabase } from "../../services/supabase"; // caminho correto
import { useNavigate } from "react-router-dom";
import logo from "../../assets/LogoMenorMG.png";

export default function Login() {
  const [accessType, setAccessType] = useState<"client" | "admin">("client");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const navigate = useNavigate();

  const getWarningMessage = () =>
    accessType === "admin"
      ? "Utilize seu e-mail e senha Mendonça Galvão."
      : "Utilize a senha criada por e-mail para realizar o acesso.";

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) {
      newErrors.email = "O e-mail é obrigatório.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Formato de e-mail inválido.";
    }
    if (!password.trim()) {
      newErrors.password = "A senha é obrigatória.";
    } else if (password.length < 6) {
      newErrors.password = "A senha deve ter no mínimo 6 caracteres.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setAuthError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthError("E-mail ou senha incorretos.");
        console.error(error);
        return;
      }

      if (data?.user) {
        const isAdmin = data.user.email?.endsWith("@mendoncagalvao.com.br");
        if (isAdmin && accessType === "admin") {
          navigate("/admin");
        } else if (!isAdmin && accessType === "client") {
          navigate("/cliente");
        } else {
          setAuthError("Tipo de acesso incorreto para este usuário.");
          await supabase.auth.signOut();
        }
      }
    } catch (err) {
      console.error(err);
      setAuthError("Erro inesperado ao tentar autenticar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-[#1c1f22] text-white px-4">
      <div className="bg-[#2e3338] p-8 rounded-lg w-full max-w-md shadow-lg">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img src="../../assets/LogoMenorMG.png" alt="Logo" className="h-14" />
        </div>

        {/* Título */}
        <h2 className="text-2xl font-semibold text-center mb-2">Login</h2>
        <p className="text-sm text-center mb-6 text-gray-300">
          Escolha o tipo de acesso e entre com suas credenciais
        </p>

        {/* Toggle Acesso */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setAccessType("client")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
              accessType === "client"
                ? "bg-yellow-500 text-black"
                : "bg-gray-700 text-white"
            }`}
          >
            Acesso Geral
          </button>
          <button
            onClick={() => setAccessType("admin")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
              accessType === "admin"
                ? "bg-yellow-500 text-black"
                : "bg-gray-700 text-white"
            }`}
          >
            Admin
          </button>
        </div>

        {/* E-mail */}
        <div className="mb-4">
          <label htmlFor="email" className="text-sm block mb-1">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            placeholder="Digite seu e-mail"
            className={`w-full p-2 rounded-md bg-black border ${
              errors.email ? "border-red-500" : "border-gray-500"
            } text-white placeholder-gray-400`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* Senha */}
        <div className="mb-2">
          <label htmlFor="password" className="text-sm block mb-1">
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Digite sua senha"
              className={`w-full p-2 pr-10 rounded-md bg-black border ${
                errors.password ? "border-red-500" : "border-gray-500"
              } text-white placeholder-gray-400`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center justify-center text-gray-400 hover:text-white focus:outline-none"
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                margin: 0,
                lineHeight: 0,
              }}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-400 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        {/* Aviso */}
        <p className="mt-3 text-sm text-yellow-100 bg-yellow-700 px-4 py-3 rounded-md mb-6">
          {getWarningMessage()}
        </p>

        {/* Erro de login */}
        {authError && (
          <p className="text-center text-red-400 text-sm mb-3">{authError}</p>
        )}

        {/* Entrar */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className={`w-full py-2 rounded-md font-semibold transition ${
            loading
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:opacity-90"
          }`}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-400">
          <a
            onClick={() => navigate("/recuperar-senha")}
            className="underline hover:text-white cursor-pointer"
          >
            Esqueci minha senha
          </a>
        </p>
      </div>
    </div>
  );
}
