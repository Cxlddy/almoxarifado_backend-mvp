import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variaveis do Supabase nao configuradas no .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
