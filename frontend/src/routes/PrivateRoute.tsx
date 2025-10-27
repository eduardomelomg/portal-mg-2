import { Navigate } from "react-router-dom";
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
  const { user, cargo, authChecked } = useAuth();

  if (!authChecked) {
    // evite flicker e já logue o estado
    console.log("[PrivateRoute] aguardando authChecked…");
    return null;
  }

  if (!user) {
    console.warn("[PrivateRoute] sem usuário confirmado pelo Supabase → /login");
    return <Navigate to="/login" replace />;
  }

  if (allowedDomain && !user.email.endsWith(allowedDomain)) {
    console.warn("[PrivateRoute] domínio bloqueado:", user.email, "→ /cliente");
    return <Navigate to="/cliente" replace />;
  }

  if (allowedRoles?.length) {
    if (!cargo) {
      console.log("[PrivateRoute] aguardando cargo…");
      return null;
    }
    if (!allowedRoles.includes(cargo as any)) {
      console.warn("[PrivateRoute] cargo sem permissão:", cargo);
      return (
        <div className="flex flex-col items-center justify-center min-h-screen text-gray-300">
          <h1 className="text-3xl font-bold mb-2">Acesso negado</h1>
          <p className="text-gray-400">Você não tem permissão para acessar esta página.</p>
        </div>
      );
    }
  }

  console.log("[PrivateRoute] liberado.");
  return <>{children}</>;
}
