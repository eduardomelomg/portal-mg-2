import express from "express";
import cors from "cors";
import { validate as isUuid } from "uuid";
import { createClient } from "@supabase/supabase-js";
import { inviteUser } from "./api/invite-user";
import { listUsers } from "./api/list-users";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("⚠️ SUPABASE_URL e/ou SUPABASE_ANON_KEY não definidos no .env");
}

const supabase = createClient(SUPABASE_URL || "", SUPABASE_ANON_KEY || "");

export function createApp() {
  const app = express();

  // ✅ Middlewares primeiro
  app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));

  app.use(express.json()); // ⬅️ COLOQUE ANTES DE TODAS AS ROTAS

    // ⬇️ Convite vem antes das demais rotas
  app.post(
    "/api/invite-user",
    (req, res, next) => {
      console.log("🚨 POST /api/invite-user RECEBIDO");
      next(); // continua para o handler real
    },
    inviteUser
  );

  // 🔋 Healthcheck
  app.get("/health", (_req, res) => res.send("ok"));

  // 🧪 Mock
  app.get("/api/users/mock", (_req, res) => {
    res.json([
      {
        id: "1",
        nome: "Alice",
        email: "alice@example.com",
        cargo: "admin",
        empresaId: "X",
        created_at: new Date().toISOString(),
      },
    ]);
  });

  app.get("/api/users", async (req, res, next) => {
    const empresaId = req.query.empresaId as string | undefined;

    if (!empresaId) {
      return res.status(400).json({ message: "empresaId é obrigatório" });
    }

    if (!isUuid(empresaId)) {
      return res
        .status(400)
        .json({ message: "empresaId inválido (UUID esperado)" });
    }

    try {
      return await listUsers(req, res);
    } catch (err) {
      next(err);
    }
  });

  // 🌐 Handler global de erros
  app.use(
    (
      err: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error("💥 Erro não tratado:", err);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  );

  return app;
}
