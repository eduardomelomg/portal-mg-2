import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../services/supabase";

type UserData = { id: string; email: string; nome: string } | null;
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
  loading: boolean; // loading de mutações internas
  authChecked: boolean; // ✅ só fica true após checar Supabase
  signOut: () => Promise<void>;
  updateLogoUrl: (url: string) => void;
  updateUserData: (data: { nome?: string; email?: string }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData>(null);
  const [empresa, setEmpresa] = useState<EmpresaData>(null);
  const [cargo, setCargo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const run = async () => {
      await verifyWithSupabase();
      setAuthChecked(true);
    };
    run();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      setAuthChecked(false);
      verifyWithSupabase().finally(() => setAuthChecked(true));
    });
    return () => subscription.unsubscribe();
  }, []);

  const verifyWithSupabase = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
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

      const confirmedUser: UserData = { id: u.id, email: u.email ?? "", nome };
      setUser(confirmedUser);

      const { data: vinc, error: vincErr } = await supabase
        .from("usuarios_empresas")
        .select("empresa_id, cargo")
        .eq("usuario_id", u.id)
        .eq("ativo", true)
        .maybeSingle();

      if (vincErr || !vinc?.empresa_id) {
        setEmpresa(null);
        setCargo(null);
        localStorage.setItem(
          "authData",
          JSON.stringify({ user: confirmedUser, empresa: null, cargo: null })
        );
        return;
      }

      const { data: emp, error: empErr } = await supabase
        .from("empresas")
        .select("id, nome, cnpj, dominio, logoUrl, telefone")
        .eq("id", vinc.empresa_id)
        .maybeSingle();

      const confirmedEmpresa: EmpresaData =
        !empErr && emp
          ? {
              id: emp.id,
              nome: emp.nome,
              cnpj: emp.cnpj ?? null,
              dominio: emp.dominio ?? null,
              logoUrl: emp.logoUrl ?? null,
              telefone: emp.telefone ?? "",
            }
          : null;

      setEmpresa(confirmedEmpresa);
      setCargo(vinc.cargo ?? null);
      localStorage.setItem(
        "authData",
        JSON.stringify({
          user: confirmedUser,
          empresa: confirmedEmpresa,
          cargo: vinc.cargo ?? null,
        })
      );
    } catch (e) {
      console.error("verifyWithSupabase falhou:", e);
      setUser(null);
      setEmpresa(null);
      setCargo(null);
      localStorage.removeItem("authData");
    }
  };

  // 📡 Realtime: atualiza dados da empresa quando houver UPDATE
  useEffect(() => {
    if (!empresa?.id) return;

    const ch = supabase
      .channel("empresa-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "empresas",
          filter: `id=eq.${empresa.id}`,
        },
        (payload) => {
          const ne = payload.new as any;

          setEmpresa((prev) =>
            prev
              ? {
                  ...prev,
                  nome: ne.nome,
                  cnpj: ne.cnpj,
                  dominio: ne.dominio,
                  logoUrl: ne.logoUrl,
                  telefone: ne.telefone,
                }
              : prev
          );

          // opcional: também sincroniza o cache
          const saved = localStorage.getItem("authData");
          if (saved) {
            const parsed = JSON.parse(saved);
            localStorage.setItem(
              "authData",
              JSON.stringify({
                ...parsed,
                empresa: {
                  ...(parsed.empresa ?? {}),
                  nome: ne.nome,
                  cnpj: ne.cnpj,
                  dominio: ne.dominio,
                  logoUrl: ne.logoUrl,
                  telefone: ne.telefone,
                },
              })
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [empresa?.id]);

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
        authChecked,
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
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error("useAuth deve ser usado dentro de um <AuthProvider>");
  return ctx;
}
