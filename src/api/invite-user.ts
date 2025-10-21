// api/invite-user.ts
import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node"; // compatível com Vercel/Netlify

// Cria um client com a Service Role Key
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ nunca use no frontend!
);

// Handler da rota
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { nome, email } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ error: "Nome e e-mail são obrigatórios" });
    }

    // Cria convite via Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { name: nome },
    });

    if (error) {
      console.error("Erro ao enviar convite:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, user: data });
  } catch (err: any) {
    console.error("Erro inesperado:", err);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
