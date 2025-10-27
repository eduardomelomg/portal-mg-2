import { useState } from "react";
//import logo from "../../assets/LogoMenorMG.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";

type Access = "client" | "admin";

export default function Login() {
  const [accessType, setAccessType] = useState<Access>("client");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const navigate = useNavigate();

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = "O e-mail é obrigatório.";
    else if (!/^\S+@\S+\.\S+$/.test(email))
      next.email = "Formato de e-mail inválido.";

    if (!password.trim()) next.password = "A senha é obrigatória.";
    else if (password.length < 6)
      next.password = "A senha deve ter no mínimo 6 caracteres.";

    // domínio obrigatório quando o usuário escolhe Admin
    if (
      accessType === "admin" &&
      email &&
      !email.endsWith("@mendoncagalvao.com.br")
    ) {
      next.email = "Para acesso Admin, use e-mail @mendoncagalvao.com.br.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const warningText =
    accessType === "admin"
      ? "Utilize seu e-mail e senha Mendonça Galvão."
      : "Utilize a senha criada por e-mail para realizar o acesso.";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!validate()) return;

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthError("E-mail ou senha incorretos.");
        console.error(error);
        return;
      }

      if (!data?.user) {
        setAuthError("Falha ao autenticar.");
        return;
      }

      const isAdmin = data.user.email?.endsWith("@mendoncagalvao.com.br");

      if (accessType === "admin") {
        if (!isAdmin) {
          setAuthError("Esta conta não possui acesso Admin.");
          await supabase.auth.signOut();
          return;
        }
        navigate("/admin", { replace: true });
      } else {
        // cliente (ajuste a rota se necessário)
        navigate("/cliente", { replace: true });
      }
    } catch (err: any) {
      console.error(err);
      setAuthError("Erro inesperado ao tentar autenticar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1215] flex items-center justify-center px-4 text-slate-100">
      <div className="w-full max-w-md rounded-xl border border-[#2a2f35] bg-[#1b1f24] shadow-2xl/20 shadow-black/30">
        {/* Logo + título */}
        <div className="px-6 pt-6 text-center">
          {/* Coloque sua logo em /public/logo.svg ou ajuste o src */}
          {/*<img src={logo} alt="Logo" className="mx-auto h-10 w-auto" />*/}
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Login</h1>
          <p className="mt-2 text-sm text-slate-400">
            Escolha o tipo de acesso e entre com suas credenciais
          </p>
        </div>

        {/* Toggle de acesso */}
        <div className="px-6 mt-5">
          <div className="grid grid-cols-2 gap-2 bg-[#232931] rounded-md p-1">
            <button
              type="button"
              onClick={() => setAccessType("client")}
              className={
                "h-9 rounded-md text-sm font-semibold transition " +
                (accessType === "client"
                  ? "bg-[#f5c518] text-black"
                  : "text-slate-300 hover:bg-[#2a3036]")
              }
            >
              Acesso Geral
            </button>
            <button
              type="button"
              onClick={() => setAccessType("admin")}
              className={
                "h-9 rounded-md text-sm font-semibold transition " +
                (accessType === "admin"
                  ? "bg-[#f5c518] text-black"
                  : "text-slate-300 hover:bg-[#2a3036]")
              }
            >
              Admin
            </button>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
          {/* E-mail */}
          <div>
            <label htmlFor="email" className="text-sm text-slate-300">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              className={`mt-1 block w-full rounded-md border bg-[#0f1215] text-slate-100 placeholder:text-slate-500 sm:text-sm focus:ring-[#f5c518] focus:border-[#f5c518] ${
                errors.email ? "border-red-500" : "border-[#2a2f35]"
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label htmlFor="password" className="text-sm text-slate-300">
              Senha
            </label>
            <div className="mt-1 relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Sua senha"
                className={`block w-full rounded-md border bg-[#0f1215] text-slate-100 placeholder:text-slate-500 pr-10 sm:text-sm focus:ring-[#f5c518] focus:border-[#f5c518] ${
                  errors.password ? "border-red-500" : "border-[#2a2f35]"
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 px-3 grid place-items-center text-slate-400 hover:text-slate-200"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password}</p>
            )}
          </div>

          {/* Aviso */}
          <p className="text-xs text-slate-400">{warningText}</p>

          {/* Erro de autenticação */}
          {authError && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {authError}
            </div>
          )}

          {/* Botão entrar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[#f5c518] px-4 py-2.5 text-sm font-semibold text-black shadow hover:bg-[#ffd23b] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          {/* link de recuperação */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/recuperar-senha")}
              className="text-sm text-sky-400 hover:text-sky-300 underline"
            >
              Esqueci minha senha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
