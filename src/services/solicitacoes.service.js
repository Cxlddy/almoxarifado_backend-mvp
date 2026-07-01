import supabase from '../database/supabase.js';
import autorizacoesService from './autorizacoes.service.js';
import whatsappService from './whatsapp.service.js';

async function listarSolicitacoes() {
  const { data, error } = await supabase
    .from('solicitacoes')
    .select(`
      id,
      status,
      justificativa,
      observacao,
      data_solicitacao,
      data_aprovacao,
      usuarios:solicitante_id (
        id,
        nome,
        email
      ),
      setores (
        id,
        nome
      ),
      centros_custo (
        id,
        codigo,
        nome
      ),
      solicitacao_itens (
        id,
        quantidade_solicitada,
        quantidade_atendida,
        observacao,
        produtos (
          id,
          nome,
          codigo_interno
        )
      )
    `)
    .order('data_solicitacao', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function criarSolicitacao(dadosSolicitacao, itens) {
  const { data: solicitacao, error: erroSolicitacao } = await supabase
    .from('solicitacoes')
    .insert([dadosSolicitacao])
    .select()
    .single();

  if (erroSolicitacao) {
    throw new Error(erroSolicitacao.message);
  }

  const itensComSolicitacao = itens.map((item) => ({
    solicitacao_id: solicitacao.id,
    produto_id: item.produto_id,
    quantidade_solicitada: item.quantidade_solicitada,
    observacao: item.observacao || null
  }));

  const { data: itensCriados, error: erroItens } = await supabase
    .from('solicitacao_itens')
    .insert(itensComSolicitacao)
    .select();

  if (erroItens) {
    throw new Error(erroItens.message);
  }

  await enviarAutorizacaoParaAlmoxarife(solicitacao);

  return {
    ...solicitacao,
    itens: itensCriados
  };
}

async function enviarAutorizacaoParaAlmoxarife(solicitacao) {
  const telefoneAlmoxarife = process.env.ALMOXARIFE_WHATSAPP;
  const appPublicUrl = process.env.APP_PUBLIC_URL || 'http://localhost:3000';

  if (!telefoneAlmoxarife) {
    return;
  }

  const autorizacao = await autorizacoesService.criarAutorizacao({
    solicitacao_id: solicitacao.id,
    almoxarife_id: null,
    telefone_whatsapp: telefoneAlmoxarife
  });

  const linkAprovar = `${appPublicUrl}/a/${autorizacao.token_aprovacao}`;
  const linkNegar = `${appPublicUrl}/n/${autorizacao.token_negacao}`;

  const mensagem = [
    '*Nova solicitação de material*',
    '',
    `Justificativa: ${solicitacao.justificativa || 'Não informada'}`,
    `Observação: ${solicitacao.observacao || 'Não informada'}`,
    '',
    `Aprovar: ${linkAprovar}`,
    '',
    `Negar: ${linkNegar}`
  ].join('\n');

  await whatsappService.enviarMensagemWhatsapp({
    telefone: telefoneAlmoxarife,
    mensagem
  });
}

async function atenderSolicitacao({ solicitacao_id, local_estoque_id, usuario_id }) {
  const { data: solicitacao, error: erroSolicitacao } = await supabase
    .from('solicitacoes')
    .select(`
      id,
      status,
      solicitacao_itens (
        id,
        produto_id,
        quantidade_solicitada,
        quantidade_atendida
      )
    `)
    .eq('id', solicitacao_id)
    .single();

  if (erroSolicitacao) {
    throw new Error(erroSolicitacao.message);
  }

  if (solicitacao.status !== 'aprovada') {
    throw new Error('A solicitação precisa estar aprovada para ser atendida');
  }

  const movimentacoes = solicitacao.solicitacao_itens
    .map((item) => ({
      produto_id: item.produto_id,
      local_estoque_id,
      usuario_id,
      solicitacao_id: solicitacao.id,
      solicitacao_item_id: item.id,
      tipo: 'saida',
      origem: 'solicitacao',
      quantidade: Number(item.quantidade_solicitada) - Number(item.quantidade_atendida || 0),
      observacao: 'Saída gerada pelo atendimento da solicitação'
    }))
    .filter((item) => item.quantidade > 0);

  if (movimentacoes.length === 0) {
    throw new Error('Não há itens pendentes para atendimento');
  }

  const { error: erroMovimentacoes } = await supabase
    .from('movimentacoes_estoque')
    .insert(movimentacoes);

  if (erroMovimentacoes) {
    throw new Error(erroMovimentacoes.message);
  }

  for (const item of solicitacao.solicitacao_itens) {
    const { error } = await supabase
      .from('solicitacao_itens')
      .update({
        quantidade_atendida: item.quantidade_solicitada
      })
      .eq('id', item.id);

    if (error) {
      throw new Error(error.message);
    }
  }

  const { data, error } = await supabase
    .from('solicitacoes')
    .update({
      status: 'atendida'
    })
    .eq('id', solicitacao_id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export default {
  listarSolicitacoes,
  criarSolicitacao,
  atenderSolicitacao
};