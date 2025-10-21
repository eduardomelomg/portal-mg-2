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

  // ===== FETCH INICIAL =====
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      console.log("🔄 Iniciando fetchData()...");

      try {
        const { data, error } = await supabase.auth.getUser();
        console.log("👤 Resultado getUser:", { data, error });

        if (error || !data?.user) {
          console.warn("⚠️ Nenhum usuário logado, redirecionando...");
          setUser(null);
          setEmpresa(null);
          setCargo(null);
          setLoading(false);
          return;
        }

        const u = data.user;
        const nome =
          (u.user_metadata as any)?.full_name ||
          u.user_metadata?.name ||
          u.email?.split("@")[0] ||
          "Usuário";

        setUser({
          id: u.id,
          email: u.email ?? "",
          nome,
        });

        console.log("✅ Usuário autenticado:", nome);

        // ===== Busca vínculo empresa =====
        const { data: vinculo, error: vinculoError } = await supabase
          .from("usuarios_empresas")
          .select("empresa_id, cargo")
          .eq("usuario_id", u.id)
          .eq("ativo", true)
          .single();

        console.log("🏢 Vínculo empresa:", { vinculo, vinculoError });

        if (vinculoError || !vinculo) {
          console.warn("⚠️ Nenhum vínculo ativo encontrado");
          setEmpresa(null);
          setCargo(null);
          setLoading(false);
          return;
        }

        setCargo(vinculo.cargo ?? null);

        // ===== Busca empresa =====
        const { data: emp, error: empError } = await supabase
          .from("empresas")
          .select("id, nome, cnpj, dominio, logoUrl, telefone")
          .eq("id", vinculo.empresa_id)
          .single();

        console.log("🏬 Empresa carregada:", { emp, empError });

        if (empError || !emp) {
          console.error("❌ Erro ao buscar empresa:", empError);
          setEmpresa(null);
        } else {
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
        console.error("🔥 Erro inesperado em fetchData():", err);
      } finally {
        console.log("🏁 Finalizando fetchData()");
        setLoading(false);
      }
    };

    fetchData();

    const { data: authSub } = supabase.auth.onAuthStateChange(() =>
      fetchData()
    );
    return () => authSub.subscription.unsubscribe();
  }, []);

  // ===== REALTIME LISTENERS =====
  useEffect(() => {
    if (!empresa?.id) return;

    // 🔁 Atualiza empresa em tempo real
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

  // 🔁 Atualiza user quando Auth muda (nome/email)

  // ===== MUTATORS =====
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

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setEmpresa(null);
    setCargo(null);
    window.location.href = "/login";
  };

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

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um <AuthProvider>");
  }
  return context;
}
