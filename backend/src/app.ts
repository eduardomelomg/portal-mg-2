// src/app.ts
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Não bloqueia o start, mas avisa no console para evitar dor de cabeça
  console.warn('⚠️  SUPABASE_URL e/ou SUPABASE_ANON_KEY não definidos no .env');
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');

export function createApp() {
  const app = express();

  // CORS para o front em dev (ajuste se necessário)
  app.use(
    cors({
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
    })
  );

  app.use(express.json());

  // Healthcheck
  app.get('/health', (_req, res) => res.send('ok'));

  // (Opcional) rota mock para testar o front rapidamente
  app.get('/api/users/mock', (_req, res) => {
    res.json([
      {
        id: '1',
        nome: 'Alice',
        name: 'Alice',
        email: 'alice@example.com',
        cargo: 'admin',
        empresaId: 'X',
        empresa_id: 'X',
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ]);
  });

  /**
   * Rota real: lista usuários por empresa (e cargo opcional).
   * Consulta a VIEW `vw_usuarios_por_empresa`.
   * Ajuste o nome se você estiver consultando diretamente `usuarios_empresas`.
   */
  app.get('/api/users', async (req, res) => {
    const cargo = (req.query.cargo as string | undefined)?.trim();
    const empresaId = (req.query.empresaId as string | undefined)?.trim();

    console.log('➡️  /api/users', { cargo, empresaId });

    if (!empresaId) {
      return res.status(400).json({ message: 'empresaId é obrigatório' });
    }

    try {
      // IMPORTANTE: se você não criou a view, troque para 'usuarios_empresas'
      // e ajuste o .select(...) com os nomes reais das colunas.
      let query = supabase
        .from('vw_usuarios_por_empresa')
        .select('id,empresa_id,cargo,nome,email,created_at', { count: 'exact' })
        .eq('empresa_id', empresaId);

      if (cargo && cargo !== 'todos') {
        query = query.eq('cargo', cargo);
      }

      const { data, error, count } = await query.order('nome', { ascending: true });

      if (error) {
        console.error('💥 Supabase error:', error);
        return res
          .status(500)
          .json({ message: 'Erro ao buscar usuários', detail: error.message, code: (error as any).code });
      }

      const users = (data ?? []).map((u: any) => {
        const createdAt = u.created_at ?? null;
        const empresa = u.empresa_id ?? u.empresaId ?? null;

        return {
          id: String(u.id),
          // nomes/compatibilidade
          nome: u.nome ?? u.name ?? '',
          name: u.nome ?? u.name ?? '',
          email: u.email ?? '',
          cargo: u.cargo ?? null,
          // empresa (duas chaves p/ evitar desencontro no front)
          empresaId: empresa,
          empresa_id: empresa,
          // datas (duas chaves p/ compatibilidade)
          createdAt,
          created_at: createdAt,
        };
      });

      console.log(`⬅️  /api/users -> ${users.length} itens (count=${count})`);
      return res.json(users);
    } catch (e: any) {
      console.error('💥 Erro inesperado em /api/users:', e);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  // Handler de erro (sempre por último)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('💥 Erro não tratado:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  });

  return app;
}
