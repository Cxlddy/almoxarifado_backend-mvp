import { createClient } from '@supabase/supabase-js';
import supabase from '../database/supabase.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias');
}

const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

async function login(email, senha) {
  const { data: loginData, error: loginError } =
    await supabaseAuth.auth.signInWithPassword({
      email,
      password: senha
    });

  if (loginError) {
    throw new Error(loginError.message);
  }

  const authUser = loginData.user;

  const { data: usuario, error: usuarioError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (usuarioError) {
    throw new Error(`Erro ao consultar tabela usuarios: ${usuarioError.message}`);
  }

  if (!usuario) {
    throw new Error(
      `Usuário autenticado no Supabase Auth, mas não existe na tabela usuarios. Auth ID: ${authUser.id} | Email: ${authUser.email}`
    );
  }

  if (usuario.ativo !== true) {
    throw new Error(
      `Usuário encontrado na tabela usuarios, mas está inativo. ID: ${usuario.id} | Email: ${usuario.email}`
    );
  }

  return {
    access_token: loginData.session.access_token,
    refresh_token: loginData.session.refresh_token,
    usuario
  };
}

async function forgotPassword(email) {
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    throw new Error('FRONTEND_URL não configurada nas variáveis de ambiente');
  }

  const redirectTo = `${frontendUrl}?resetar_senha=true`;

  const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
    redirectTo
  });

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

async function resetPassword({ access_token, refresh_token, senha }) {
  const supabaseRecovery = createClient(supabaseUrl, supabaseAnonKey);

  const { error: sessionError } = await supabaseRecovery.auth.setSession({
    access_token,
    refresh_token
  });

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  const { error: updateError } = await supabaseRecovery.auth.updateUser({
    password: senha
  });

  if (updateError) {
    throw new Error(updateError.message);
  }

  return true;
}

export default {
  login,
  forgotPassword,
  resetPassword
};