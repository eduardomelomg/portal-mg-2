import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../services/supabase";

type UserData = {
  id: string;
  email: string;
  nome: string;
} | null;

type EmpresaData = {
  id: string;
  nome: string;
  cnpj: string | null;
  dominio?: string | null;
  logoUrl?: string | null;
  telefone?: string | null;
} | null;

interface AuthContextType {
  user: UserData;
  empresa: EmpresaData;
  cargo: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateLogoUrl: (url: string) => void;
  updateUserData: (data: { nome?: string; email?: string }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData>(null);
  const [empresa, setEmpresa] = useState<EmpresaData>(null);
  const [cargo, setCargo] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // ============================================================
  // === FETCH INICIAL E LOGIN / LOGOUT LISTENER
  // ============================================================
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      console.log("🟡 [useAuth] Iniciando fetchData()");
      setLoading(true);

      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
          console.warn("🔴 [useAuth] Nenhum usuário autenticado.");
          if (mounted) {
            setUser(null);
            setEmpresa(null);
            setCargo(null);
            setLoading(false);
          }
          return;
        }

        const u = data.user;
        const nome =
          (u.user_metadata as any)?.full_name ||
          u.user_metadata?.name ||
          u.email?.split("@")[0] ||
          "Usuário";

        if (mounted) {
          setUser({
            id: u.id,
            email: u.email ?? "",
            nome,
          });
        }

        const { data: vinculo } = await supabase
          .from("usuarios_empresas")
          .select("empresa_id, cargo")
          .eq("usuario_id", u.id)
          .eq("ativo", true)
          .single();

        if (!vinculo) {
          console.warn(
            "⚠️ [useAuth] Nenhum vínculo encontrado para o usuário."
          );
          return;
        }

        if (mounted) setCargo(vinculo.cargo ?? null);

        const { data: emp } = await supabase
          .from("empresas")
          .select("id, nome, cnpj, dominio, logoUrl, telefone")
          .eq("id", vinculo.empresa_id)
          .single();

        if (mounted && emp) {
          setEmpresa({
            id: emp.id,
            nome: emp.nome,
            cnpj: emp.cnpj ?? null,
            dominio: emp.dominio ?? null,
            logoUrl: emp.logoUrl ?? null,
            telefone: emp.telefone ?? "",
          });
        }
      } catch (err) {
        console.error("Erro ao carregar dados do Auth:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // 🔹 só roda se user for null (não logado ainda)
    if (!user) {
      fetchData();
    }

    // 🔁 escuta eventos do Supabase, mas sem refazer fetch desnecessário
    const { data: authSub } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          console.log("🟢 [useAuth] Sessão ativa detectada.");
          fetchData();
        } else {
          console.warn("🔴 [useAuth] Sessão finalizada.");
          setUser(null);
          setEmpresa(null);
          setCargo(null);
        }
      }
    );

    return () => {
      mounted = false;
      authSub.subscription.unsubscribe();
    };
  }, []);

  // ============================================================
  // === REALTIME: ATUALIZAÇÃO DA EMPRESA
  // ============================================================
  useEffect(() => {
    if (!empresa?.id) return;

    console.log("🔁 Escutando realtime da empresa:", empresa.id);

    const empSub = supabase
      .channel("empresa-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "empresas",
          filter: `id=eq.${empresa.id}`,
        },
        (payload) => {
          const novaEmpresa = payload.new as any;
          console.log("🟢 Atualização realtime recebida:", novaEmpresa);

          setEmpresa((prev) =>
            prev
              ? {
                  ...prev,
                  nome: novaEmpresa.nome,
                  cnpj: novaEmpresa.cnpj,
                  dominio: novaEmpresa.dominio,
                  logoUrl: novaEmpresa.logoUrl,
                  telefone: novaEmpresa.telefone,
                }
              : prev
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(empSub);
    };
  }, [empresa?.id]);

  // ============================================================
  // === MUTATORS (Atualizações locais)
  // ============================================================
  const updateLogoUrl = (url: string) => {
    setEmpresa((prev) => (prev ? { ...prev, logoUrl: url } : prev));
  };

  const updateUserData = ({
    nome,
    email,
  }: {
    nome?: string;
    email?: string;
  }) => {
    setUser((prev) =>
      prev
        ? { ...prev, nome: nome ?? prev.nome, email: email ?? prev.email }
        : prev
    );
  };

  // ============================================================
  // === LOGOUT
  // ============================================================
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setEmpresa(null);
    setCargo(null);
    window.location.href = "/login";
  };

  // ============================================================
  // === CONTEXTO
  // ============================================================
  return (
    <AuthContext.Provider
      value={{
        user,
        empresa,
        cargo,
        loading,
        signOut,
        updateLogoUrl,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// === HOOK DE USO
// ============================================================
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um <AuthProvider>");
  }
  return context;
}
