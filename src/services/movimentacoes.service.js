import supabase from '../database/supabase.js';

async function listarMovimentacoes() {
  const { data, error } = await supabase
    .from('movimentacoes_estoque')
    .select(`
      id,
      tipo,
      origem,
      quantidade,
      documento,
      lote,
      data_validade,
      observacao,
      data_movimentacao,
      produtos ( id, nome, codigo_interno ),
      locais_estoque ( id, nome ),
      usuarios ( id, nome, email )
    `)
    .order('data_movimentacao', { ascending: false })
    .limit(300);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function criarMovimentacao(dadosMovimentacao) {
  const { data, error } = await supabase
    .from('movimentacoes_estoque')
    .insert([dadosMovimentacao])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export default {
  criarMovimentacao
};