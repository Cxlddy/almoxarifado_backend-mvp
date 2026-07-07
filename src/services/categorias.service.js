import supabase from '../database/supabase.js';
import { pick, uuidValido } from '../utils/data.utils.js';

const camposPermitidos = ['nome', 'descricao', 'ativo'];

function prepararDados(dados, { parcial = false } = {}) {
  const dadosSeguros = pick(dados, camposPermitidos);

  if (!parcial && !dadosSeguros.nome) {
    throw new Error('O campo nome e obrigatorio');
  }

  if (Object.prototype.hasOwnProperty.call(dadosSeguros, 'ativo')) {
    dadosSeguros.ativo = dadosSeguros.ativo === true || dadosSeguros.ativo === 'true' || dadosSeguros.ativo === 1 || dadosSeguros.ativo === '1';
  }

  Object.keys(dadosSeguros).forEach((campo) => {
    if (typeof dadosSeguros[campo] === 'string') {
      dadosSeguros[campo] = dadosSeguros[campo].trim();
    }
  });

  if (parcial && Object.keys(dadosSeguros).length === 0) {
    throw new Error('Nenhum campo valido para atualizar');
  }

  return dadosSeguros;
}

async function listarCategorias() {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function criarCategoria(dados) {
  const dadosSeguros = prepararDados(dados);

  const { data, error } = await supabase
    .from('categorias')
    .insert([dadosSeguros])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function atualizarCategoria(id, dados) {
  if (!uuidValido(id)) {
    throw new Error('Identificador invalido');
  }

  const dadosSeguros = prepararDados(dados, { parcial: true });

  const { data, error } = await supabase
    .from('categorias')
    .update(dadosSeguros)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export default {
  listarCategorias,
  criarCategoria,
  atualizarCategoria
};
