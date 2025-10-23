import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
  console.error('❌ Faltam variáveis VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
  throw new Error('Env inválido: configure .env e reinicie o dev server');
}
if (!/^https:\/\/.+\.supabase\.co/.test(url)) {
  console.warn('⚠️ VITE_SUPABASE_URL parece estranho:', url);
}

export const supabase = createClient(url, anon);
