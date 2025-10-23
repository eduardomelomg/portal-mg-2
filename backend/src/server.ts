import 'dotenv/config';
import { createApp } from './app';

const BASE_PORT = Number(process.env.PORT) || 5050;

function tryListen(port: number) {
  const app = createApp();
  return new Promise<{ port: number }>((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`✅ Backend rodando em http://localhost:${port}`);
      resolve({ port });
    });
    server.on('error', (err: any) => {
      if (err?.code === 'EADDRINUSE') reject({ code: 'EADDRINUSE' });
      else reject(err);
    });
  });
}

(async () => {
  let port = BASE_PORT;
  for (let i = 0; i < 10; i += 1) {
    try {
      const { port: used } = await tryListen(port);
      if (used !== BASE_PORT) console.warn(`⚠️ Porta ${BASE_PORT} indisponível. Usando ${used}.`);
      return;
    } catch (e: any) {
      if (e?.code === 'EADDRINUSE') {
        console.warn(`⚠️ Porta ${port} em uso. Tentando ${port + 1}...`);
        port += 1;
        continue;
      }
      console.error('Erro ao iniciar servidor:', e);
      process.exit(1);
    }
  }
  console.error('❌ Não foi possível iniciar servidor.');
  process.exit(1);
})();
