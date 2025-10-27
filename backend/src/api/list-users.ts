import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import type { Request, Response } from "express";

dotenv.config({ path: "./.env" });

// Tipos
type Vinculo = {
  usuario_id: string;
  empresa_id: string | null;
  cargo?: string | null;
  ativo?: boolean | null;
};

type EmpresaRow = { id: string; nome: string | null };

type UsuarioCompleto = {
  id: string;
  email: string;
  nome: string;
  cargo: string;
  empresa_id: string | null;
  empresa_nome: string;
  created_at: string;
};

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes no .env");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const uniq = <T,>(arr: (T | null | undefined)[]) =>
  Array.from(new Set(arr.filter(Boolean) as T[]));

export const listUsers = async (req: Request, res: Response) => {
  try {
    const { cargo, empresaId, search } = req.query as {
      cargo?: string;
      empresaId?: string;
      search?: string;
    };

    // 1) Vínculos (filtra por empresa quando não for admin)
    let vQuery = supabaseAdmin
      .from("usuarios_empresas")
      .select("usuario_id, empresa_id, cargo, ativo")
      .eq("ativo", true);

    if (cargo !== "admin" && empresaId) {
      vQuery = vQuery.eq("empresa_id", empresaId);
    }

    const { data: vinculosRaw, error: vincErr } = await vQuery;
    if (vincErr) {
      console.error("❌ Erro ao buscar vínculos:", vincErr);
      return res.status(400).json({ message: "Erro ao buscar vínculos" });
    }
    const vinculos = (vinculosRaw ?? []) as Vinculo[];

    // 2) Usuários do Auth
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (authErr) {
      console.error("❌ Erro ao listar usuários:", authErr);
      return res.status(400).json({ message: "Erro ao listar usuários" });
    }
    const allUsers = authData?.users ?? [];

    // Mantém apenas usuários que possuem vínculo (quando não admin)
    const userIdsComVinculo = uniq(vinculos.map((v) => v.usuario_id));
    const usersFiltrados =
      cargo !== "admin" && empresaId
        ? allUsers.filter((u) => userIdsComVinculo.includes(u.id))
        : allUsers;

    // 3) Busca nomes das empresas
    const empresaIds = uniq(
      vinculos.map((v) => v.empresa_id).filter(Boolean) as string[]
    );

    let empresasMap = new Map<string, string>();
    if (empresaIds.length) {
      const { data: empresas, error: empErr } = await supabaseAdmin
        .from("empresas")
        .select("id, nome")
        .in("id", empresaIds);

      if (empErr) {
        console.error("❌ Erro ao buscar empresas:", empErr);
        return res.status(400).json({ message: "Erro ao buscar empresas" });
      }

      (empresas as EmpresaRow[]).forEach((e) => {
        empresasMap.set(e.id, e.nome ?? "—");
      });
    }

    // 4) Montagem
    const usuariosCompletos: UsuarioCompleto[] = usersFiltrados.map((user) => {
      const vinc = vinculos.find((v) => v.usuario_id === user.id);
      const meta = (user.user_metadata || {}) as Record<string, any>;

      const nome =
        (typeof meta.name === "string" && meta.name.trim()) ||
        meta.full_name ||
        meta.nome ||
        "—";

      const empNome = vinc?.empresa_id ? empresasMap.get(vinc.empresa_id) ?? "—" : "—";

      return {
        id: user.id,
        email: user.email ?? "",
        nome,
        cargo: vinc?.cargo || meta.cargo || "—",
        empresa_id: vinc?.empresa_id ?? null,
        empresa_nome: empNome,
        created_at: user.created_at,
      };
    });

    // 5) Filtro de busca
    const resultado =
      search && search.trim()
        ? usuariosCompletos.filter((u) => {
            const t = search.toLowerCase();
            return (
              (u.email || "").toLowerCase().includes(t) ||
              (u.nome || "").toLowerCase().includes(t)
            );
          })
        : usuariosCompletos;

    return res.status(200).json({ usuarios: resultado });
  } catch (err) {
    console.error("❌ Erro inesperado:", err);
    return res.status(500).json({ message: "Erro interno no servidor" });
  }
};
