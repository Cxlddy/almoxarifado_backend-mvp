import supabase from '../database/supabase.js';
import { pick } from '../utils/data.utils.js';

const CAMPOS_PRODUTO = [
  'categoria_id',
  'unidade_medida_id',
  'nome',
  'descricao',
  'codigo_interno',
  'codigo_barras',
  'estoque_minimo',
  'estoque_maximo',
  'controla_validade',
  'controla_lote'
];

async function listarProdutos() {
  const { data, error } = await supabase
    .from('produtos')
    .select(`
      id,
      nome,
      descricao,
      codigo_interno,
      codigo_barras,
      estoque_minimo,
      estoque_maximo,
      ativo,
      categorias (
        id,
        nome
      ),
      unidades_medida (
        id,
        sigla,
        nome
      )
    `)
    .order('nome', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function criarProduto(dadosProduto) {
  const dadosSeguros = pick(dadosProduto, CAMPOS_PRODUTO);

  const { data, error } = await supabase
    .from('produtos')
    .insert([dadosSeguros])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export default {
  listarProdutos,
  criarProduto
};
