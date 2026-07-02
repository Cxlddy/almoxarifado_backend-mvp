import supabase from '../database/supabase.js';
import { pick, uuidValido } from '../utils/data.utils.js';

const CAMPOS_USUARIO = [
  'id',
  'nome',
  'email',
  'perfil',
  'setor_id',
  'centro_custo_id',
  'cargo',
  'telefone',
  'ativo'
];

const CAMPOS_ATUALIZACAO_USUARIO = CAMPOS_USUARIO.filter((campo) => campo !== 'id');

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

  if (!uuidValido(dadosSeguros.id)) {
    throw new Error('ID de usuário inválido');
  }

  if (!['admin', 'usuario'].includes(dadosSeguros.perfil)) {
    dadosSeguros.perfil = 'usuario';
  }

  const { data, error } = await supabase
    .from('usuarios')
    .insert([dadosSeguros])
    .select()
    .single();

  if (error) {
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
  atualizarUsuario
};
