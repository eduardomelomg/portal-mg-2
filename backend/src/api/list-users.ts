import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import type { Request, Response } from "express";

// ✅ Garante que o dotenv seja carregado antes de criar o cliente
dotenv.config({ path: "./.env", override: true });

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "❌ Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes no .env"
  );
  console.error("Valor atual de SUPABASE_URL:", SUPABASE_URL);
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

interface UsuarioCompleto {
  id: string;
  email: string;
  nome: string;
  cargo: string;
  empresa_id: string | null;
  empresa_nome: string;
  created_at: string;
}

export const listUsers = async (req: Request, res: Response) => {
  try {
    const { cargo, empresaId, search } = req.query as {
      cargo?: string;
      empresaId?: string;
      search?: string;
    };

    // 🔹 Busca todos os usuários cadastrados no Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      console.error("Erro ao listar usuários:", error.message);
      return res.status(400).json({ error: error.message });
    }

    const allUsers = data?.users || [];

    // 🔹 Busca vínculos de usuários às empresas
    const { data: vinculos, error: vincError } = await supabaseAdmin
      .from("usuarios_empresas")
      .select("usuario_id, empresa_id, cargo, empresa_nome, empresas(nome)");

    if (vincError) {
      console.error("Erro ao buscar vínculos:", vincError.message);
      return res.status(400).json({ error: vincError.message });
    }

    // 🔹 Monta os dados completos
    const usuariosCompletos: UsuarioCompleto[] = allUsers.map((user) => {
      const vinculo = vinculos?.find((v) => v.usuario_id === user.id);

      // ✅ Garante que user_metadata exista
      const userMeta = (user.user_metadata || {}) as Record<string, any>;

      return {
        id: user.id,
        email: user.email ?? "—",
        nome:
          typeof userMeta.name === "string" && userMeta.name.trim() !== ""
            ? userMeta.name
            : userMeta.full_name || userMeta.nome || "—",
        cargo: vinculo?.cargo || userMeta.cargo || userMeta.role || "—",
        empresa_id: vinculo?.empresa_id || null,
        empresa_nome:
          (vinculo as any)?.empresas?.nome ||
          (vinculo as any)?.empresa_nome ||
          "—",

        created_at: user.created_at,
      };
    });

    // 🔹 Filtro por empresa (somente se não for admin)
    const filtradosPorEmpresa = usuariosCompletos.filter((usuario) => {
      if (cargo !== "admin" && empresaId) {
        return usuario.empresa_id === empresaId;
      }
      return true;
    });

    // 🔹 Filtro de busca (por nome ou e-mail)
    const filtradosPorBusca = filtradosPorEmpresa.filter((usuario) => {
      if (search) {
        const termo = search.toLowerCase();
        return (
          usuario.email.toLowerCase().includes(termo) ||
          usuario.nome.toLowerCase().includes(termo)
        );
      }
      return true;
    });

    // ✅ Retorna o resultado final
    res.status(200).json({ users: filtradosPorBusca });
  } catch (err: any) {
    console.error("Erro inesperado:", err);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
};
