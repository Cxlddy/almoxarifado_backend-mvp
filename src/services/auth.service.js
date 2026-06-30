import { createClient } from '@supabase/supabase-js';
import supabase from '../database/supabase.js';

const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function login(email, senha) {
  const { data: loginData, error: loginError } =
    await supabaseAuth.auth.signInWithPassword({
      email,
      password: senha
    });

  if (loginError) {
    throw new Error(loginError.message);
  }

  const userId = loginData.user.id;

  const { data: usuario, error: usuarioError } = await supabase
    .from('usuarios')
    .select(`
      id,
      nome,
      email,
      perfil,
      cargo,
      telefone,
      ativo,
      setores (
        id,
        nome
      ),
      centros_custo (
        id,
        codigo,
        nome
      )
    `)
    .eq('id', userId)
    .eq('ativo', true)
    .single();

  if (usuarioError || !usuario) {
    throw new Error('Usuário não cadastrado ou inativo no sistema');
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
  const supabaseRecovery = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

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