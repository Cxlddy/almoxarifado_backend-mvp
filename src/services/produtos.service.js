import supabase from '../database/supabase.js';
import { pick, uuidValido } from '../utils/data.utils.js';

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

function erroUnidadeObrigatoria(error) {
  const msg = String(error?.message || '').toLowerCase();
  return msg.includes('unidade_medida_id') || msg.includes('unidades_medida');
}

async function garantirUnidadePadrao() {
  const { data: existente, error: erroBusca } = await supabase
    .from('unidades_medida')
    .select('id')
    .eq('sigla', 'UN')
    .limit(1);

  if (!erroBusca && existente?.[0]?.id) {
    return existente[0].id;
  }

  const { data: criada, error: erroCriacao } = await supabase
    .from('unidades_medida')
    .insert([{ nome: 'Unidade', sigla: 'UN', ativo: true }])
    .select('id')
    .single();

  if (erroCriacao) {
    throw new Error(erroCriacao.message);
  }

  return criada.id;
}

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

async function inserirProduto(dadosSeguros) {
  return supabase
    .from('produtos')
    .insert([dadosSeguros])
    .select()
    .single();
}

async function criarProduto(dadosProduto) {
  const dadosSeguros = pick(dadosProduto, CAMPOS_PRODUTO);
  const quantidadeInicial = Number(dadosProduto.quantidade_inicial || 0);
  const localEstoqueId = dadosProduto.local_estoque_id || null;
  const usuarioId = dadosProduto.usuario_id || null;

  dadosSeguros.categoria_id = dadosSeguros.categoria_id || null;
  dadosSeguros.codigo_barras = dadosSeguros.codigo_barras || null;
  dadosSeguros.estoque_minimo = Number(dadosSeguros.estoque_minimo || 0);
  dadosSeguros.estoque_maximo = dadosSeguros.estoque_maximo ? Number(dadosSeguros.estoque_maximo) : null;
  dadosSeguros.controla_validade = dadosSeguros.controla_validade === true;
  dadosSeguros.controla_lote = dadosSeguros.controla_lote === true;

  let { data, error } = await inserirProduto(dadosSeguros);

  if (error && erroUnidadeObrigatoria(error) && !dadosSeguros.unidade_medida_id) {
    dadosSeguros.unidade_medida_id = await garantirUnidadePadrao();
    const tentativa = await inserirProduto(dadosSeguros);
    data = tentativa.data;
    error = tentativa.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  if (quantidadeInicial > 0) {
    const { error: erroMovimentacao } = await supabase
      .from('movimentacoes_estoque')
      .insert([{
        produto_id: data.id,
        local_estoque_id: localEstoqueId,
        usuario_id: usuarioId,
        tipo: 'entrada',
        origem: 'manual',
        quantidade: quantidadeInicial,
        observacao: 'Entrada inicial registrada no cadastro do produto'
      }]);

    if (erroMovimentacao) {
      throw new Error(`Produto criado, mas houve erro ao registrar a quantidade inicial: ${erroMovimentacao.message}`);
    }
  }

  return data;
}

async function atualizarProduto(id, dadosProduto) {
  const dadosSeguros = pick(dadosProduto, [...CAMPOS_PRODUTO, 'ativo']);

  delete dadosSeguros.unidade_medida_id;

  if (Object.prototype.hasOwnProperty.call(dadosSeguros, 'estoque_minimo')) {
    dadosSeguros.estoque_minimo = Number(dadosSeguros.estoque_minimo || 0);
  }

  if (Object.prototype.hasOwnProperty.call(dadosSeguros, 'estoque_maximo')) {
    dadosSeguros.estoque_maximo = dadosSeguros.estoque_maximo ? Number(dadosSeguros.estoque_maximo) : null;
  }

  const { data, error } = await supabase
    .from('produtos')
    .update(dadosSeguros)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function removerProduto(id) {
  if (!uuidValido(id)) {
    throw new Error('Produto inválido');
  }

  const { data: produto, error: erroBusca } = await supabase
    .from('produtos')
    .select('id, nome')
    .eq('id', id)
    .single();

  if (erroBusca || !produto) {
    throw new Error('Produto não encontrado');
  }

  const { error } = await supabase
    .from('produtos')
    .delete()
    .eq('id', id);

  if (!error) {
    return { ...produto, excluido: true };
  }

  const { data: desativado, error: erroDesativar } = await supabase
    .from('produtos')
    .update({ ativo: false })
    .eq('id', id)
    .select('id, nome, ativo')
    .single();

  if (erroDesativar) {
    throw new Error(error.message);
  }

  return { ...desativado, desativado: true };
}

export default {
  listarProdutos,
  criarProduto,
  atualizarProduto,
  removerProduto
};
