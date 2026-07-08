import { createClient } from '@supabase/supabase-js';
import supabase from '../database/supabase.js';
import { normalizarTelefone } from '../utils/data.utils.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias');
}

const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
}

function candidatosTelefone(identificador) {
  const raw = String(identificador || '').trim();
  const digits = raw.replace(/\D/g, '');
  const normalizado = normalizarTelefone(raw);
  const sem55 = normalizado.startsWith('55') ? normalizado.slice(2) : normalizado;

  return [...new Set([raw, digits, normalizado, sem55].filter(Boolean))];
}

async function buscarUsuarioPorIdentificador(identificador) {
  if (emailValido(identificador)) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, perfil, setor_id, centro_custo_id, cargo, telefone, ativo')
      .eq('email', String(identificador).trim().toLowerCase())
      .maybeSingle();

    if (error) {
      throw new Error('Erro ao consultar usuário');
    }

    return data;
  }

  const telefones = candidatosTelefone(identificador);

  if (!telefones.length) {
    return null;
  }

  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nome, email, perfil, setor_id, centro_custo_id, cargo, telefone, ativo')
    .in('telefone', telefones)
    .limit(1);

  if (error) {
    throw new Error('Erro ao consultar usuário');
  }

  return data?.[0] || null;
}

async function login(identificador, senha) {
  const usuarioLogin = await buscarUsuarioPorIdentificador(identificador);

  if (!usuarioLogin || usuarioLogin.ativo !== true || !usuarioLogin.email) {
    throw new Error('Usuário não encontrado ou inativo');
  }

  const { data: loginData, error: loginError } =
    await supabaseAuth.auth.signInWithPassword({
      email: usuarioLogin.email,
      password: senha
    });

  if (loginError || !loginData?.session?.access_token || !loginData?.user) {
    throw new Error('Credenciais inválidas');
  }

  const { data: usuario, error: usuarioError } = await supabase
    .from('usuarios')
    .select('id, nome, email, perfil, setor_id, centro_custo_id, cargo, telefone, ativo')
    .eq('id', loginData.user.id)
    .maybeSingle();

  if (usuarioError || !usuario || usuario.ativo !== true) {
    throw new Error('Usuário não encontrado ou sem permissão de acesso');
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
