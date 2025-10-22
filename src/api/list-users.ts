// src/api/list-users.ts
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import type { Request, Response } from "express";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Variáveis SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes.");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Helpers seguros para string/search
const s = (v: unknown) => (typeof v === "string" ? v : "");
const toLower = (v: unknown) => s(v).toLowerCase();

export const listUsers = async (req: Request, res: Response) => {
  try {
    // cargo: 'admin' | 'gestor' | 'colaborador'
    const cargo = String(req.query.cargo || "").toLowerCase();
    const empresaId = s(req.query.empresaId);
    const search = toLower(req.query.search).trim();

    // 1) Usuários do Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    const allUsers = authData?.users ?? [];

    // 2) Vínculos (cargo/empresa) — filtra por empresa se não for admin
    let vinculosQuery = supabaseAdmin
      .from("usuarios_empresas")
      .select("usuario_id, empresa_id, cargo, ativo");

    if (cargo !== "admin" && empresaId) {
      vinculosQuery = vinculosQuery.eq("empresa_id", empresaId);
    }

    const { data: vinculos, error: vinculoError } = await vinculosQuery;
    if (vinculoError) throw vinculoError;

    const vinculosArr = vinculos ?? [];

    // 3) Empresas: pega apenas as necessárias (ids vistas nos vínculos)
    const empresaIds = Array.from(
      new Set(vinculosArr.map((v) => v.empresa_id).filter(Boolean))
    ) as string[];

    let empresasMap = new Map<string, string>(); // empresa_id -> nome
    if (empresaIds.length > 0) {
      // ajuste o nome da coluna abaixo conforme seu schema: 'nome', 'razao_social', 'nome_fantasia', etc.
      const { data: empresas, error: empErr } = await supabaseAdmin
        .from("empresas")
        .select("id, nome") // <-- altere aqui se sua coluna tiver outro nome
        .in("id", empresaIds);

      if (empErr) throw empErr;

      for (const e of empresas ?? []) {
        empresasMap.set(e.id, s((e as any).nome)); // se for 'razao_social', troque aqui também
      }
    }

    // 4) Mescla Auth + vínculo + nome da empresa (seguro)
    const mesclados = allUsers
      .map((user: any) => {
        const vinculo = vinculosArr.find((v) => v.usuario_id === user.id);
        const eid = vinculo?.empresa_id ?? null;
        const enome = eid ? empresasMap.get(eid) ?? "—" : "—";

        return {
          id: user.id,
          email: s(user.email),
          nome: s(user.user_metadata?.name) || "—",
          cargo: s(vinculo?.cargo) || s(user.user_metadata?.cargo) || "—",
          empresa_id: eid,
          empresa_nome: enome,
          created_at: user.created_at,
        };
      })
      // 4.1) Restringe por empresa se não for admin
      .filter((u) => {
        if (cargo !== "admin" && empresaId) return u.empresa_id === empresaId;
        return true;
      })
      // 4.2) Busca segura
      .filter((u) => {
        if (!search) return true;
        return (
          toLower(u.email).includes(search) ||
          toLower(u.nome).includes(search) ||
          toLower(u.empresa_nome).includes(search)
        );
      });

    // 5) Agrupa por empresa para admin
    if (cargo === "admin") {
      const empresasObj: Record<
        string,
        { empresa_id: string | null; empresa_nome: string; usuarios: typeof mesclados }
      > = {};

      for (const u of mesclados) {
        const key = u.empresa_id ?? "sem_empresa";
        if (!empresasObj[key]) {
          empresasObj[key] = {
            empresa_id: u.empresa_id,
            empresa_nome: u.empresa_nome || "Sem empresa",
            usuarios: [],
          };
        }
        empresasObj[key].usuarios.push(u);
      }

      const empresas = Object.values(empresasObj).sort((a, b) =>
        a.empresa_nome.localeCompare(b.empresa_nome, "pt-BR")
      );

      return res.status(200).json({ empresas });
    }

    // 6) Gestor/Colaborador: lista simples
    return res.status(200).json({ users: mesclados });
  } catch (err: any) {
    console.error("❌ Erro ao listar usuários:", err?.message || err);
    return res.status(500).json({ error: "Erro ao listar usuários." });
  }
};
