import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import type { Request, Response } from "express";

dotenv.config({ path: "./.env" });

// Tipos auxiliares
type EmpresaRef = { nome?: string | null } | null | undefined;
type Vinculo = {
  usuario_id: string;
  empresa_id: string | null;
  cargo?: string | null;
  empresas?: EmpresaRef;
  empresa_nome?: string | null;
};

type UsuarioCompleto = {
  id: string;
  email: string;
  nome: string;
  cargo: string;
  empresa_id: string | null;
  empresa_nome: string;
  created_at: string;
};

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes no .env (backend/.env)");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// 🚀 Rota principal
export const listUsers = async (req: Request, res: Response) => {
  try {
    const { cargo, empresaId, search } = req.query as {
      cargo?: string;
      empresaId?: string;
      search?: string;
    };

    // 1) Auth users
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers();
    if (authErr) {
      console.error("❌ Erro ao listar usuários:", authErr.message);
      return res.status(400).json({ error: authErr.message });
    }

    const allUsers = authData?.users ?? [];

    // 2) Vínculos
    const { data: vinculosRaw, error: vincErr } = await supabaseAdmin
      .from("usuarios_empresas")
      .select("usuario_id, empresa_id, cargo, empresas(nome)");

    if (vincErr) {
      console.error("❌ Erro ao buscar vínculos:", vincErr.message);
      return res.status(400).json({ error: vincErr.message });
    }

    const vinculos = (vinculosRaw ?? []) as Vinculo[];

    // 3) Composição do usuário
    const usuariosCompletos: UsuarioCompleto[] = allUsers.map((user) => {
      const vinculo = vinculos.find((v) => v.usuario_id === user.id);
      const meta = (user.user_metadata || {}) as Record<string, any>;

      const nome =
        (typeof meta.name === "string" && meta.name.trim()) ||
        meta.full_name ||
        meta.nome ||
        "—";

      const empresaNome = vinculo?.empresas?.nome ?? vinculo?.empresa_nome ?? "—";

      return {
        id: user.id,
        email: user.email ?? "",
        nome,
        cargo: vinculo?.cargo || meta.cargo || "—",
        empresa_id: vinculo?.empresa_id ?? null,
        empresa_nome: empresaNome,
        created_at: user.created_at,
      };
    });

    // 4) Filtros (cargo e empresa)
    const porEmpresa =
      cargo !== "admin" && empresaId
        ? usuariosCompletos.filter((u) => u.empresa_id === empresaId)
        : usuariosCompletos;

    const porBusca = !search
      ? porEmpresa
      : porEmpresa.filter((u) => {
          const termo = search.toLowerCase();
          return (
            (u.email || "").toLowerCase().includes(termo) ||
            (u.nome || "").toLowerCase().includes(termo)
          );
        });

    return res.status(200).json({ usuarios: porBusca });
  } catch (err) {
    console.error("❌ Erro inesperado:", err);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
};
