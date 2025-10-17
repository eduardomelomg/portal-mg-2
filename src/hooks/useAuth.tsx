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
} | null;

interface AuthContextType {
  user: UserData;
  empresa: EmpresaData;
  cargo: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData>(null);
  const [empresa, setEmpresa] = useState<EmpresaData>(null);
  const [cargo, setCargo] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1️⃣ Buscar usuário autenticado
        const { data, error } = await supabase.auth.getUser();

        if (error || !data?.user) {
          console.warn("Nenhum usuário autenticado:", error);
          setUser(null);
          setEmpresa(null);
          setCargo(null);
          return;
        }

        const u = data.user;
        const nome =
          (u.user_metadata as any)?.full_name ||
          (u.user_metadata as any)?.name ||
          (u.email ?? "").split("@")[0] ||
          "Usuário";

        setUser({
          id: u.id,
          email: u.email ?? "",
          nome,
        });

        // 2️⃣ Buscar vínculo do usuário com empresa
        const { data: vinculo, error: vinculoErr } = await supabase
          .from("usuarios_empresas")
          .select("empresa_id, cargo")
          .eq("usuario_id", u.id)
          .eq("ativo", true)
          .single();

        if (vinculoErr) {
          console.warn("Sem vínculo encontrado:", vinculoErr);
          setEmpresa(null);
          setCargo(null);
          return;
        }

        setCargo(vinculo.cargo ?? null);

        // 3️⃣ Buscar dados da empresa
        const { data: emp, error: empErr } = await supabase
          .from("empresas")
          .select("id, nome, cnpj, dominio")
          .eq("id", vinculo.empresa_id)
          .single();

        if (empErr) {
          console.error("Erro ao buscar empresa:", empErr);
          setEmpresa(null);
        } else {
          setEmpresa({
            id: emp.id,
            nome: emp.nome,
            cnpj: emp.cnpj ?? null,
            dominio: emp.dominio ?? null,
          });
        }
      } catch (e) {
        console.error("Erro inesperado no useAuth:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setEmpresa(null);
    setCargo(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, empresa, cargo, loading, signOut }}>
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
