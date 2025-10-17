import { Navigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useEffect, useState } from "react";

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedDomain?: string; // opcional
}

export default function PrivateRoute({ children, allowedDomain }: PrivateRouteProps) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div className="text-white p-6">Carregando...</div>;

  if (!session) return <Navigate to="/login" replace />;

  // se tiver restrição de domínio, checa aqui
  if (
    allowedDomain &&
    !session?.user?.email?.endsWith(allowedDomain)
  ) {
    return <Navigate to="/cliente" replace />;
  }

  return <>{children}</>;
}
