import supabase from '../database/supabase.js';
import autorizacoesService from './autorizacoes.service.js';
import whatsappService from './whatsapp.service.js';
import { numeroPositivo, uuidValido } from '../utils/data.utils.js';

function erroDeColunaInexistente(error, coluna) {
  const texto = String(error?.message || error || '').toLowerCase();
  return texto.includes(coluna.toLowerCase()) || texto.includes('column');
}

async function anexarAutorizacoes(solicitacoes) {
  const ids = (solicitacoes || []).map((s) => s.id).filter(Boolean);

  if (!ids.length) {
    return solicitacoes || [];
  }

  const { data: autorizacoes, error } = await supabase
    .from('autorizacoes_solicitacao')
    .select(`
      id,
      solicitacao_id,
      almoxarife_id,
      status,
      respondido_em,
      usuarios:almoxarife_id (
        id,
        nome,
        email,
        telefone
      )
    `)
    .in('solicitacao_id', ids);

  if (error) {
    console.error('Erro ao anexar autorizações:', error.message);
    return solicitacoes || [];
  }

  const porSolicitacao = new Map();

  for (const autorizacao of autorizacoes || []) {
    if (!porSolicitacao.has(autorizacao.solicitacao_id)) {
      porSolicitacao.set(autorizacao.solicitacao_id, autorizacao);
    }
  }

  return (solicitacoes || []).map((solicitacao) => ({
    ...solicitacao,
    autorizacao_admin: porSolicitacao.get(solicitacao.id) || null
  }));
}

async function listarSolicitacoes(usuario) {
  let query = supabase
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

  if (usuario?.perfil !== 'admin') {
    query = query.eq('solicitante_id', usuario.id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return anexarAutorizacoes(data || []);
}

async function buscarSolicitacaoCompleta(id) {
  const { data, error } = await supabase
    .from('solicitacoes')
    .select(`
      id,
      status,
      justificativa,
      observacao,
      data_solicitacao,
      usuarios:solicitante_id (
        id,
        nome,
        email,
        cargo,
        telefone
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
        observacao,
        produtos (
          id,
          nome,
          codigo_interno
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const [comAutorizacao] = await anexarAutorizacoes([data]);
  return comAutorizacao;
}

async function criarSolicitacao(dadosSolicitacao, itens, admin_id) {
  if (!uuidValido(admin_id)) {
    throw new Error('Admin responsável inválido');
  }

  if (!Array.isArray(itens) || itens.length === 0 || itens.length > 50) {
    throw new Error('A solicitação precisa ter entre 1 e 50 itens');
  }

  itens.forEach((item) => {
    if (!uuidValido(item.produto_id) || !numeroPositivo(item.quantidade_solicitada)) {
      throw new Error('Item de solicitação inválido');
    }
  });

  const { data: admin, error: erroAdmin } = await supabase
    .from('usuarios')
    .select('id, nome, telefone, perfil, ativo')
    .eq('id', admin_id)
    .eq('perfil', 'admin')
    .eq('ativo', true)
    .single();

  if (erroAdmin || !admin) {
    throw new Error('Admin responsável não encontrado ou inativo');
  }

  if (!admin.telefone) {
    throw new Error('O admin selecionado não possui telefone cadastrado');
  }

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
    quantidade_solicitada: Number(item.quantidade_solicitada),
    observacao: item.observacao || null
  }));

  const { data: itensCriados, error: erroItens } = await supabase
    .from('solicitacao_itens')
    .insert(itensComSolicitacao)
    .select();

  if (erroItens) {
    throw new Error(erroItens.message);
  }

  const solicitacaoCompleta = await buscarSolicitacaoCompleta(solicitacao.id);

  try {
    await enviarAutorizacaoParaAdmin(solicitacaoCompleta, admin);
  } catch (error) {
    console.error('Erro ao enviar autorização por WhatsApp:', error.message);
  }

  return {
    ...solicitacaoCompleta,
    itens: itensCriados
  };
}

async function enviarAutorizacaoParaAdmin(solicitacao, admin) {
  const appPublicUrl = process.env.APP_PUBLIC_URL || process.env.BACKEND_PUBLIC_URL || 'http://localhost:3000';

  const autorizacao = await autorizacoesService.criarAutorizacao({
    solicitacao_id: solicitacao.id,
    almoxarife_id: admin.id,
    telefone_whatsapp: admin.telefone
  });

  const linkAprovar = `${appPublicUrl}/a/${autorizacao.token_aprovacao}`;
  const linkNegar = `${appPublicUrl}/n/${autorizacao.token_negacao}`;

  const mensagem = whatsappService.montarMensagemAutorizacao({
    solicitacao,
    solicitante: solicitacao.usuarios,
    itens: solicitacao.solicitacao_itens || [],
    admin,
    linkAprovar,
    linkNegar
  });

  await whatsappService.enviarMensagemWhatsapp({
    telefone: admin.telefone,
    mensagem
  });
}

async function atualizarSolicitacaoStatusComFallback({ solicitacao_id, status, usuario_id }) {
  const dataResposta = new Date().toISOString();
  const tentativas = [
    {
      status,
      data_aprovacao: status === 'aprovada' ? dataResposta : null,
      aprovado_por: usuario_id
    },
    {
      status,
      data_aprovacao: status === 'aprovada' ? dataResposta : null
    },
    { status }
  ];

  let ultimoErro = null;

  for (const payload of tentativas) {
    const { error } = await supabase
      .from('solicitacoes')
      .update(payload)
      .eq('id', solicitacao_id);

    if (!error) return;

    ultimoErro = error;

    if (!erroDeColunaInexistente(error, 'aprovado_por') && !erroDeColunaInexistente(error, 'data_aprovacao')) {
      break;
    }
  }

  throw new Error(ultimoErro?.message || 'Erro ao atualizar solicitação');
}

async function responderSolicitacaoPeloSistema({ solicitacao_id, usuario_id, resposta }) {
  if (!uuidValido(solicitacao_id) || !uuidValido(usuario_id)) {
    throw new Error('Solicitação inválida');
  }

  const { data: autorizacao, error: erroAutorizacao } = await supabase
    .from('autorizacoes_solicitacao')
    .select('*')
    .eq('solicitacao_id', solicitacao_id)
    .eq('almoxarife_id', usuario_id)
    .eq('status', 'pendente')
    .maybeSingle();

  if (erroAutorizacao) {
    throw new Error(erroAutorizacao.message);
  }

  if (!autorizacao) {
    throw new Error('Apenas o admin responsável pela solicitação pode aprovar ou negar pelo sistema');
  }

  if (autorizacao.expira_em && new Date(autorizacao.expira_em) < new Date()) {
    await supabase
      .from('autorizacoes_solicitacao')
      .update({ status: 'expirada' })
      .eq('id', autorizacao.id);

    throw new Error('Autorização expirada');
  }

  const statusSolicitacao = resposta === 'aprovada' ? 'aprovada' : 'recusada';

  await atualizarSolicitacaoStatusComFallback({
    solicitacao_id,
    status: statusSolicitacao,
    usuario_id
  });

  const { error: erroResposta } = await supabase
    .from('autorizacoes_solicitacao')
    .update({
      status: resposta,
      respondido_em: new Date().toISOString()
    })
    .eq('id', autorizacao.id)
    .eq('status', 'pendente');

  if (erroResposta) {
    throw new Error(erroResposta.message);
  }

  return buscarSolicitacaoCompleta(solicitacao_id);
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
  responderSolicitacaoPeloSistema,
  atenderSolicitacao
};
