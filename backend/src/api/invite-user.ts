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

// 🚀 Função principal
export const inviteUser = async (req: Request, res: Response) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { nome, email, cargo, empresaId } = req.body;

    if (!nome || !email || !empresaId) {
      return res
        .status(400)
        .json({ error: "Nome, e-mail e empresaId são obrigatórios." });
    }

    // Redirecionamento do convite
    const redirectUrl =
      process.env.INVITE_REDIRECT_URL || "http://localhost:5173/criar-senha";

    // Envia convite pelo Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: { name: nome },
        redirectTo: redirectUrl,
      }
    );

    if (error) {
      console.error("❌ Erro ao enviar convite:", error.message);
      return res.status(400).json({ error: error.message });
    }

    const novoUsuario = data?.user;
    if (!novoUsuario) {
      return res.status(400).json({ error: "Falha ao criar usuário." });
    }

    // Vincula o usuário à empresa
    const { error: vinculoError } = await supabaseAdmin
      .from("usuarios_empresas")
      .insert([
        {
          usuario_id: novoUsuario.id,
          empresa_id: empresaId,
          cargo: cargo || "colaborador",
          ativo: true,
        },
      ]);

    if (vinculoError) {
      console.error(
        "⚠️ Usuário criado, mas erro ao vincular:",
        vinculoError.message
      );
      return res
        .status(400)
        .json({ error: "Usuário criado, mas falha ao vincular à empresa." });
    }

    console.log(`✅ Convite enviado para ${email}`);
    return res.status(200).json({ success: true, user: novoUsuario });
  } catch (err: any) {
    console.error("❌ Erro inesperado ao convidar usuário:", err);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};
