import crypto from 'crypto';
import supabase from '../database/supabase.js';
import whatsappService from './whatsapp.service.js';

function gerarTokenCurto() {
  return crypto.randomBytes(32).toString('base64url');
}

async function listarEmprestimosPendentes(usuario) {
  const { data: itens, error: erroItens } = await supabase
    .from('solicitacao_itens')
    .select(`
      id,
      produto_id,
      quantidade_solicitada,
      quantidade_atendida,
      observacao,
      produtos (
        id,
        nome,
        codigo_interno
      ),
      solicitacoes (
        id,
        solicitante_id,
        status,
        justificativa,
        data_solicitacao,
        usuarios:solicitante_id (
          id,
          nome,
          email
        )
      )
    `)
    .gt('quantidade_atendida', 0);

  if (erroItens) {
    throw new Error(erroItens.message);
  }

  const itemIds = itens.map((item) => item.id);

  if (itemIds.length === 0) {
    return [];
  }

  const { data: devolucoesConfirmadas, error: erroConfirmadas } = await supabase
    .from('movimentacoes_estoque')
    .select('solicitacao_item_id, quantidade')
    .in('solicitacao_item_id', itemIds)
    .eq('tipo', 'entrada')
    .eq('origem', 'devolucao');

  if (erroConfirmadas) {
    throw new Error(erroConfirmadas.message);
  }

  const { data: devolucoesPendentes, error: erroPendentes } = await supabase
    .from('devolucoes_emprestimos')
    .select('solicitacao_item_id, quantidade')
    .in('solicitacao_item_id', itemIds)
    .eq('status', 'pendente');

  if (erroPendentes) {
    throw new Error(erroPendentes.message);
  }

  const confirmadoPorItem = devolucoesConfirmadas.reduce((total, mov) => {
    total[mov.solicitacao_item_id] =
      (total[mov.solicitacao_item_id] || 0) + Number(mov.quantidade || 0);

    return total;
  }, {});

  const pendentePorItem = devolucoesPendentes.reduce((total, dev) => {
    total[dev.solicitacao_item_id] =
      (total[dev.solicitacao_item_id] || 0) + Number(dev.quantidade || 0);

    return total;
  }, {});

  return itens
    .map((item) => {
      const quantidadeAtendida = Number(item.quantidade_atendida || 0);
      const quantidadeDevolvida = Number(confirmadoPorItem[item.id] || 0);
      const quantidadeAguardandoConfirmacao = Number(pendentePorItem[item.id] || 0);

      const quantidadePendente =
        quantidadeAtendida - quantidadeDevolvida - quantidadeAguardandoConfirmacao;

      return {
        id: item.id,
        solicitacao_id: item.solicitacoes?.id || null,
        produto_id: item.produto_id,
        produto: item.produtos,
        solicitacao: item.solicitacoes,
        quantidade_atendida: quantidadeAtendida,
        quantidade_devolvida: quantidadeDevolvida,
        quantidade_aguardando_confirmacao: quantidadeAguardandoConfirmacao,
        quantidade_pendente_devolucao: quantidadePendente,
        observacao: item.observacao
      };
    })
    .filter((item) => usuario?.perfil === 'admin' || item.solicitacao?.solicitante_id === usuario?.id)
    .filter((item) => item.quantidade_pendente_devolucao > 0);
}

async function solicitarDevolucao(dados, usuario) {
  const {
    solicitacao_item_id,
    local_estoque_id,
    quantidade,
    observacao
  } = dados;

  if (!solicitacao_item_id) {
    throw new Error('O item da solicitação é obrigatório');
  }

  if (!local_estoque_id) {
    throw new Error('O local de estoque é obrigatório');
  }

  if (!quantidade || Number(quantidade) <= 0) {
    throw new Error('A quantidade deve ser maior que zero');
  }

  const { data: item, error: erroItem } = await supabase
    .from('solicitacao_itens')
    .select(`
      id,
      solicitacao_id,
      produto_id,
      quantidade_atendida,
      produtos (
        id,
        nome,
        codigo_interno
      ),
      solicitacoes (
        id,
        solicitante_id,
        justificativa,
        usuarios:solicitante_id (
          id,
          nome,
          email
        )
      )
    `)
    .eq('id', solicitacao_item_id)
    .single();

  if (erroItem) {
    throw new Error(erroItem.message);
  }

  if (usuario?.perfil !== 'admin' && item.solicitacoes?.solicitante_id !== usuario?.id) {
    throw new Error('Você só pode solicitar devolução dos seus próprios empréstimos');
  }

  const quantidadeAtendida = Number(item.quantidade_atendida || 0);

  if (quantidadeAtendida <= 0) {
    throw new Error('Este item ainda não foi emprestado');
  }

  const { data: devolucoesConfirmadas, error: erroDevolucoes } = await supabase
    .from('movimentacoes_estoque')
    .select('quantidade')
    .eq('solicitacao_item_id', solicitacao_item_id)
    .eq('tipo', 'entrada')
    .eq('origem', 'devolucao');

  if (erroDevolucoes) {
    throw new Error(erroDevolucoes.message);
  }

  const totalConfirmado = devolucoesConfirmadas.reduce(
    (total, mov) => total + Number(mov.quantidade || 0),
    0
  );

  const { data: devolucoesPendentes, error: erroPendentes } = await supabase
    .from('devolucoes_emprestimos')
    .select('quantidade')
    .eq('solicitacao_item_id', solicitacao_item_id)
    .eq('status', 'pendente');

  if (erroPendentes) {
    throw new Error(erroPendentes.message);
  }

  const totalPendente = devolucoesPendentes.reduce(
    (total, dev) => total + Number(dev.quantidade || 0),
    0
  );

  const quantidadeDisponivel = quantidadeAtendida - totalConfirmado - totalPendente;

  if (quantidadeDisponivel <= 0) {
    throw new Error('Este item já possui devolução pendente de confirmação ou já foi totalmente devolvido');
  }

  if (Number(quantidade) > quantidadeDisponivel) {
    throw new Error(`A quantidade máxima para devolução é ${quantidadeDisponivel}`);
  }

  const tokenConfirmacao = gerarTokenCurto();
  const tokenNegacao = gerarTokenCurto();

  const { data: devolucao, error: erroDevolucao } = await supabase
    .from('devolucoes_emprestimos')
    .insert([{
      solicitacao_id: item.solicitacao_id,
      solicitacao_item_id: item.id,
      produto_id: item.produto_id,
      local_estoque_id,
      solicitado_por_id: usuario?.id || null,
      quantidade: Number(quantidade),
      observacao: observacao || null,
      token_confirmacao: tokenConfirmacao,
      token_negacao: tokenNegacao,
      status: 'pendente'
    }])
    .select()
    .single();

  if (erroDevolucao) {
    throw new Error(erroDevolucao.message);
  }

  await enviarMensagemConfirmacao(devolucao, item);

  return devolucao;
}

async function enviarMensagemConfirmacao(devolucao, item) {
  const appPublicUrl = process.env.APP_PUBLIC_URL || 'http://localhost:3000';

  const { data: autorizacao, error } = await supabase
    .from('autorizacoes_solicitacao')
    .select(`
      id,
      almoxarife_id,
      usuarios:almoxarife_id (
        id,
        nome,
        telefone
      )
    `)
    .eq('solicitacao_id', item.solicitacao_id)
    .eq('status', 'aprovada')
    .order('respondido_em', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!autorizacao || !autorizacao.usuarios) {
    throw new Error('Não foi encontrado o admin que aprovou esta solicitação');
  }

  const admin = autorizacao.usuarios;

  if (!admin.telefone) {
    throw new Error('O admin que aprovou esta solicitação não possui telefone cadastrado');
  }

  const linkConfirmar = `${appPublicUrl}/devolucoes/confirmar/${devolucao.token_confirmacao}`;
  const linkNegar = `${appPublicUrl}/devolucoes/negar/${devolucao.token_negacao}`;

  const mensagem = [
    '*Solicitação de devolução de item*',
    '',
    `Admin responsável: ${admin.nome || 'Não informado'}`,
    `Produto: ${item.produtos?.nome || 'Não informado'}`,
    `Código: ${item.produtos?.codigo_interno || 'Sem código'}`,
    `Quantidade: ${devolucao.quantidade}`,
    `Solicitante: ${item.solicitacoes?.usuarios?.nome || 'Não informado'}`,
    '',
    `Confirmar devolução: ${linkConfirmar}`,
    '',
    `Negar devolução: ${linkNegar}`
  ].join('\n');

  try {
    await whatsappService.enviarMensagemWhatsapp({
      telefone: admin.telefone,
      mensagem
    });
  } catch (error) {
    console.error('Erro ao enviar WhatsApp de devolução:', error.message);
  }
}

async function buscarDevolucaoPendentePorToken(campo, token) {
  const { data: devolucao, error } = await supabase
    .from('devolucoes_emprestimos')
    .select('*')
    .eq(campo, token)
    .single();

  if (error) {
    throw new Error('Link inválido ou devolução não encontrada');
  }

  if (devolucao.status !== 'pendente') {
    throw new Error('Esta devolução já foi respondida');
  }

  return devolucao;
}

async function confirmarDevolucao(token) {
  const devolucao = await buscarDevolucaoPendentePorToken('token_confirmacao', token);

  const { data: devolucaoConfirmada, error: erroConfirmacao } = await supabase
    .from('devolucoes_emprestimos')
    .update({
      status: 'confirmada',
      respondido_em: new Date().toISOString()
    })
    .eq('id', devolucao.id)
    .eq('status', 'pendente')
    .select()
    .single();

  if (erroConfirmacao || !devolucaoConfirmada) {
    throw new Error('Esta devolução já foi respondida');
  }

  const { data: movimentacao, error: erroMovimentacao } = await supabase
    .from('movimentacoes_estoque')
    .insert([{
      produto_id: devolucao.produto_id,
      local_estoque_id: devolucao.local_estoque_id,
      usuario_id: devolucao.solicitado_por_id,
      solicitacao_id: devolucao.solicitacao_id,
      solicitacao_item_id: devolucao.solicitacao_item_id,
      tipo: 'entrada',
      origem: 'devolucao',
      quantidade: devolucao.quantidade,
      observacao: devolucao.observacao || 'Devolução confirmada pelo administrador'
    }])
    .select()
    .single();

  if (erroMovimentacao) {
    await supabase
      .from('devolucoes_emprestimos')
      .update({
        status: 'pendente',
        respondido_em: null
      })
      .eq('id', devolucao.id);

    throw new Error(erroMovimentacao.message);
  }

  const { data, error } = await supabase
    .from('devolucoes_emprestimos')
    .update({
      movimentacao_id: movimentacao.id,
      respondido_em: new Date().toISOString()
    })
    .eq('id', devolucao.id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function negarDevolucao(token) {
  const devolucao = await buscarDevolucaoPendentePorToken('token_negacao', token);

  const { data, error } = await supabase
    .from('devolucoes_emprestimos')
    .update({
      status: 'negada',
      respondido_em: new Date().toISOString()
    })
    .eq('id', devolucao.id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export default {
  listarEmprestimosPendentes,
  solicitarDevolucao,
  confirmarDevolucao,
  negarDevolucao
};
