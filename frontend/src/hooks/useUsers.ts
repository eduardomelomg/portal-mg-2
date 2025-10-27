import { useEffect, useState } from "react";
import { useAuth } from "./useAuth"; // Caminho relativo, pois está na mesma pasta

type User = {
  id: string;
  nome: string;
  email: string;
  cargo: string;
};

export function useUsers() {
  const { empresa, cargo } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      // ⚠️ Só busca se empresa e cargo estiverem disponíveis
      if (!empresa?.id || !cargo) return;

      try {
        setLoading(true);
        const res = await fetch(
          `/api/users?cargo=${cargo}&empresaId=${empresa.id}`
        );

        if (!res.ok) {
          throw new Error("Erro ao buscar usuários");
        }

        const data = await res.json();
        setUsers(data); // Ajuste se sua API retornar { users: [...] }
        setError(null);
      } catch (err: any) {
        console.error("Erro ao buscar /api/users:", err);
        setError(err.message || "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [empresa?.id, cargo]); // ✅ Executa apenas quando necessário

  return { users, loading, error };
}
