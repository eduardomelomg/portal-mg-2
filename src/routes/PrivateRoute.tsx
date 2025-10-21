import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { useAuth } from "../hooks/useAuth";

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedDomain?: string;
  allowedRoles?: Array<"admin" | "gestor" | "colaborador">;
}

export default function PrivateRoute({
  children,
  allowedDomain,
  allowedRoles,
}: PrivateRouteProps) {
  const { user, cargo, loading: authLoading } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setSessionLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // 🧩 Debug opcional
  console.log("🧩 PrivateRoute check:", {
    session,
    user,
    cargo,
    allowedDomain,
    allowedRoles,
    authLoading,
    sessionLoading,
  });

  // 🕓 Espera contexto e sessão carregarem
  if (authLoading || sessionLoading || !session || !user) {
    return <div className="text-white p-6">Carregando autenticação...</div>;
  }

  // 🚫 Nenhum usuário autenticado
  if (!session?.user) {
    console.warn("🔴 PrivateRoute: sem sessão, redirecionando para login.");
    return <Navigate to="/login" replace />;
  }

  // 🚫 Domínio não permitido
  const email = session.user?.email || user.email || "";
  if (allowedDomain && !email.endsWith(allowedDomain)) {
    console.warn(`🚫 Domínio não permitido (${email})`);
    return <Navigate to="/cliente" replace />;
  }

  // 🚫 Cargo não permitido
  if (allowedRoles?.length) {
    if (!cargo) {
      // ainda carregando cargo
      return <div className="text-white p-6">Carregando permissões...</div>;
    }

    const isAllowed = allowedRoles.includes(cargo as any);
    if (!isAllowed) {
      console.warn(`🚫 Cargo "${cargo}" sem permissão.`);
      return (
        <div className="flex flex-col items-center justify-center min-h-screen text-gray-300">
          <h1 className="text-3xl font-bold mb-2">Acesso negado</h1>
          <p className="text-gray-400">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      );
    }
  }

  // ✅ Tudo certo, renderiza conteúdo protegido
  return <>{children}</>;
}
