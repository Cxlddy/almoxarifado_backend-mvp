import supabase from '../database/supabase.js';
import {
  normalizarTelefone,
  pick,
  telefoneValido,
  uuidValido
} from '../utils/data.utils.js';

const CAMPOS_USUARIO = [
  'nome',
  'email',
  'perfil',
  'setor_id',
  'centro_custo_id',
  'cargo',
  'telefone',
  'ativo'
];

const CAMPOS_ATUALIZACAO_USUARIO = CAMPOS_USUARIO;

async function listarUsuarios() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nome, email, perfil, setor_id, centro_custo_id, cargo, telefone, ativo')
    .order('nome', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function criarUsuario(dadosUsuario) {
  const dadosSeguros = pick(dadosUsuario, CAMPOS_USUARIO);
  const senha = String(dadosUsuario.senha || '');

  if (!dadosSeguros.nome) {
    throw new Error('O nome do usuário é obrigatório');
  }

  if (!dadosSeguros.email) {
    throw new Error('O email do usuário é obrigatório');
  }

  if (!telefoneValido(dadosSeguros.telefone)) {
    throw new Error('Telefone válido é obrigatório');
  }

  if (senha.length < 8) {
    throw new Error('A senha inicial deve ter pelo menos 8 caracteres');
  }

  if (!['admin', 'usuario'].includes(dadosSeguros.perfil)) {
    dadosSeguros.perfil = 'usuario';
  }

  dadosSeguros.telefone = normalizarTelefone(dadosSeguros.telefone);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: dadosSeguros.email,
    password: senha,
    email_confirm: true,
    user_metadata: {
      nome: dadosSeguros.nome,
      perfil: dadosSeguros.perfil
    }
  });

  if (authError || !authData?.user) {
    throw new Error(authError?.message || 'Erro ao criar usuário no Auth');
  }

  dadosSeguros.id = authData.user.id;
  dadosSeguros.ativo = dadosSeguros.ativo !== false;

  const { data, error } = await supabase
    .from('usuarios')
    .insert([dadosSeguros])
    .select()
    .single();

  if (error) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new Error(error.message);
  }

  return data;
}

async function atualizarUsuario(id, dadosUsuario) {
  if (!uuidValido(id)) {
    throw new Error('ID de usuário inválido');
  }

  const dadosSeguros = pick(dadosUsuario, CAMPOS_ATUALIZACAO_USUARIO);

  if (dadosSeguros.perfil && !['admin', 'usuario'].includes(dadosSeguros.perfil)) {
    throw new Error('Perfil inválido');
  }

  if (Object.prototype.hasOwnProperty.call(dadosSeguros, 'telefone')) {
    if (!telefoneValido(dadosSeguros.telefone)) {
      throw new Error('Telefone inválido');
    }

    dadosSeguros.telefone = normalizarTelefone(dadosSeguros.telefone);
  }

  const { data, error } = await supabase
    .from('usuarios')
    .update(dadosSeguros)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function removerUsuario(id, usuarioLogado) {
  if (!uuidValido(id)) {
    throw new Error('ID de usuário inválido');
  }

  if (usuarioLogado?.id === id) {
    throw new Error('Você não pode excluir o próprio usuário logado');
  }

  const { data: usuarioExistente, error: consultaError } = await supabase
    .from('usuarios')
    .select('id, nome, email')
    .eq('id', id)
    .single();

  if (consultaError || !usuarioExistente) {
    throw new Error(consultaError?.message || 'Usuário não encontrado');
  }

  const { error: tabelaError } = await supabase
    .from('usuarios')
    .delete()
    .eq('id', id);

  if (tabelaError) {
    throw new Error(tabelaError.message);
  }

  const { error: authError } = await supabase.auth.admin.deleteUser(id);

  if (authError) {
    throw new Error('Usuário removido da tabela, mas houve erro ao remover o acesso no Auth: ' + authError.message);
  }

  return usuarioExistente;
}

async function listarAdmins() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nome, email, telefone')
    .eq('perfil', 'admin')
    .eq('ativo', true)
    .order('nome', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export default {
  listarUsuarios,
  listarAdmins,
  criarUsuario,
  atualizarUsuario,
  removerUsuario
};




