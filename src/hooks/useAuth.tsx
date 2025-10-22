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

  // ===== 🧠 Função principal de carregamento =====
  const fetchData = async (forceReload = false) => {
    console.log("🟡 [useAuth] Iniciando fetchData()");

    // ⚙️ Se já tiver dados e não for forçado, não refaz fetch
    if (user && empresa && !forceReload) {
      console.log("⚙️ Dados já carregados em memória. Pulando fetch.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        console.warn("Nenhum usuário autenticado:", error);
        setUser(null);
        setEmpresa(null);
        setCargo(null);
        localStorage.removeItem("authData");
        return;
      }

      const u = data.user;
      const nome =
        (u.user_metadata as any)?.full_name ||
        (u.user_metadata as any)?.name ||
        (u.email ?? "").split("@")[0] ||
        "Usuário";

      const newUser: UserData = {
        id: u.id,
        email: u.email ?? "",
        nome,
      };

      // Busca vínculo empresa
      const { data: vinculo, error: vinculoErr } = await supabase
        .from("usuarios_empresas")
        .select("empresa_id, cargo")
        .eq("usuario_id", u.id)
        .eq("ativo", true)
        .single();

      if (vinculoErr || !vinculo) {
        console.warn("Sem vínculo encontrado:", vinculoErr);
        setEmpresa(null);
        setCargo(null);
        localStorage.removeItem("authData");
        return;
      }

      const newCargo = vinculo.cargo ?? null;

      // Busca dados da empresa
      const { data: emp, error: empErr } = await supabase
        .from("empresas")
        .select("id, nome, cnpj, dominio, logoUrl, telefone")
        .eq("id", vinculo.empresa_id)
        .single();

      if (empErr) {
        console.error("Erro ao buscar empresa:", empErr);
        setEmpresa(null);
        return;
      }

      const newEmpresa: EmpresaData = {
        id: emp.id,
        nome: emp.nome,
        cnpj: emp.cnpj ?? null,
        dominio: emp.dominio ?? null,
        logoUrl: emp.logoUrl ?? null,
        telefone: emp.telefone ?? "",
      };

      // ✅ Atualiza estado e salva localmente
      setUser(newUser);
      setEmpresa(newEmpresa);
      setCargo(newCargo);

      localStorage.setItem(
        "authData",
        JSON.stringify({
          user: newUser,
          empresa: newEmpresa,
          cargo: newCargo,
        })
      );

      console.log("🟢 [useAuth] Sessão ativa detectada e salva no localStorage.");
    } catch (e) {
      console.error("Erro inesperado no useAuth:", e);
    } finally {
      setLoading(false);
    }
  };

  // ===== 🔁 Carrega do localStorage ao iniciar =====
  useEffect(() => {
    const saved = localStorage.getItem("authData");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed.user);
        setEmpresa(parsed.empresa);
        setCargo(parsed.cargo);
        console.log("💾 Dados restaurados do localStorage.");
      } catch {
        console.warn("Erro ao restaurar localStorage. Limpando dados.");
        localStorage.removeItem("authData");
      }
    }

    // Faz o primeiro fetch (caso dados expirados)
    fetchData();

    // Escuta login/logout apenas
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        console.log("🔄 Auth state mudou, recarregando dados...");
        fetchData(true); // força recarregar
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ===== Realtime Empresa =====
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
          setEmpresa((prev) => {
            const updated = prev
              ? {
                  ...prev,
                  nome: novaEmpresa.nome,
                  cnpj: novaEmpresa.cnpj,
                  dominio: novaEmpresa.dominio,
                  logoUrl: novaEmpresa.logoUrl,
                  telefone: novaEmpresa.telefone,
                }
              : prev;

            // Atualiza localStorage em tempo real
            const saved = localStorage.getItem("authData");
            if (saved) {
              const parsed = JSON.parse(saved);
              localStorage.setItem(
                "authData",
                JSON.stringify({ ...parsed, empresa: updated })
              );
            }

            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(empSub);
    };
  }, [empresa?.id]);

  // ===== Mutators =====
  const updateLogoUrl = (url: string) => {
    setEmpresa((prev) => {
      const updated = prev ? { ...prev, logoUrl: url } : prev;

      const saved = localStorage.getItem("authData");
      if (saved && updated) {
        const parsed = JSON.parse(saved);
        localStorage.setItem(
          "authData",
          JSON.stringify({ ...parsed, empresa: updated })
        );
      }

      return updated;
    });
  };

  const updateUserData = ({ nome, email }: { nome?: string; email?: string }) => {
    setUser((prev) => {
      const updated = prev
        ? { ...prev, nome: nome ?? prev.nome, email: email ?? prev.email }
        : prev;

      const saved = localStorage.getItem("authData");
      if (saved && updated) {
        const parsed = JSON.parse(saved);
        localStorage.setItem(
          "authData",
          JSON.stringify({ ...parsed, user: updated })
        );
      }

      return updated;
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setEmpresa(null);
    setCargo(null);
    localStorage.removeItem("authData");
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
