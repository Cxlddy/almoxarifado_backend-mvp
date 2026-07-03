import crypto from 'crypto';
import supabase from '../database/supabase.js';

function gerarTokenCurto() {
  return crypto.randomBytes(32).toString('base64url');
}

function erroDeColunaInexistente(error, coluna) {
  const texto = String(error?.message || error || '').toLowerCase();
  return texto.includes(coluna.toLowerCase()) || texto.includes('column');
}

async function atualizarSolicitacaoComFallback(autorizacao, resposta) {
  const status = resposta === 'aprovada' ? 'aprovada' : 'recusada';
  const dataResposta = new Date().toISOString();
  const tentativas = [
    {
      status,
      data_aprovacao: resposta === 'aprovada' ? dataResposta : null,
      aprovado_por: autorizacao.almoxarife_id
    },
    {
      status,
      data_aprovacao: resposta === 'aprovada' ? dataResposta : null
    },
    { status }
  ];

  let ultimoErro = null;

  for (const payload of tentativas) {
    const { error } = await supabase
      .from('solicitacoes')
      .update(payload)
      .eq('id', autorizacao.solicitacao_id);

    if (!error) {
      return;
    }

    ultimoErro = error;

    const podeTentarPayloadMenor =
      erroDeColunaInexistente(error, 'aprovado_por') ||
      erroDeColunaInexistente(error, 'data_aprovacao');

    if (!podeTentarPayloadMenor) {
      break;
    }
  }

  throw new Error(ultimoErro?.message || 'Erro ao atualizar solicitação');
}

async function marcarAutorizacaoRespondida(autorizacao, resposta) {
  const respondidoEm = new Date().toISOString();
  const tentativas = [
    { status: resposta, respondido_em: respondidoEm },
    { respondido_em: respondidoEm },
    { status: resposta }
  ];

  for (const payload of tentativas) {
    const { error } = await supabase
      .from('autorizacoes_solicitacao')
      .update(payload)
      .eq('id', autorizacao.id);

    if (!error) {
      return;
    }

    const podeTentarPayloadMenor =
      erroDeColunaInexistente(error, 'respondido_em') ||
      erroDeColunaInexistente(error, 'status') ||
      String(error.message || '').toLowerCase().includes('invalid input value');

    if (!podeTentarPayloadMenor) {
      console.error('Erro ao marcar autorização como respondida:', error.message);
      return;
    }
  }
}

async function criarAutorizacao({
  solicitacao_id,
  almoxarife_id,
  telefone_whatsapp
}) {
  const token_aprovacao = gerarTokenCurto();
  const token_negacao = gerarTokenCurto();

  const { data, error } = await supabase
    .from('autorizacoes_solicitacao')
    .insert([{
      solicitacao_id,
      almoxarife_id,
      telefone_whatsapp,
      token_aprovacao,
      token_negacao,
      status: 'pendente'
    }])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function responderAutorizacao(token, resposta) {
  const campoToken = resposta === 'aprovada'
    ? 'token_aprovacao'
    : 'token_negacao';

  const { data: autorizacao, error: erroBusca } = await supabase
    .from('autorizacoes_solicitacao')
    .select('*')
    .eq(campoToken, token)
    .single();

  if (erroBusca || !autorizacao) {
    throw new Error('Autorização inválida ou já respondida');
  }

  if (new Date(autorizacao.expira_em) < new Date()) {
    await supabase
      .from('autorizacoes_solicitacao')
      .update({ status: 'expirada' })
      .eq('id', autorizacao.id);

    throw new Error('Autorização expirada');
  }

  const novoStatusSolicitacao =
    resposta === 'aprovada' ? 'aprovada' : 'recusada';

  const { data: autorizacaoRespondida, error: erroResposta } = await supabase
    .from('autorizacoes_solicitacao')
    .update({
      status: resposta,
      respondido_em: new Date().toISOString()
    })
    .eq('id', autorizacao.id)
    .eq('status', 'pendente')
    .select()
    .single();

  if (erroResposta || !autorizacaoRespondida) {
    throw new Error('Autorização inválida ou já respondida');
  }

  let payloadSolicitacao = {
    status: novoStatusSolicitacao,
    data_aprovacao: resposta === 'aprovada' ? new Date().toISOString() : null,
    aprovado_por: autorizacao.almoxarife_id
  };

  let { error: erroSolicitacao } = await supabase
    .from('solicitacoes')
    .update(payloadSolicitacao)
    .eq('id', autorizacao.solicitacao_id);

  if (erroSolicitacao && erroDeColunaInexistente(erroSolicitacao, 'aprovado_por')) {
    payloadSolicitacao = {
      status: novoStatusSolicitacao,
      data_aprovacao: resposta === 'aprovada' ? new Date().toISOString() : null
    };

    const fallback = await supabase
      .from('solicitacoes')
      .update(payloadSolicitacao)
      .eq('id', autorizacao.solicitacao_id);

    erroSolicitacao = fallback.error;
  }

  if (erroSolicitacao) {
    await supabase
      .from('autorizacoes_solicitacao')
      .update({
        status: 'pendente',
        respondido_em: null
      })
      .eq('id', autorizacao.id);

    throw new Error(erroSolicitacao.message);
  }

  return autorizacaoRespondida;
}

async function responderAutorizacaoSeguro(token, resposta) {
  const campoToken = resposta === 'aprovada'
    ? 'token_aprovacao'
    : 'token_negacao';

  const { data: autorizacao, error: erroBusca } = await supabase
    .from('autorizacoes_solicitacao')
    .select('*')
    .eq(campoToken, token)
    .single();

  if (erroBusca || !autorizacao) {
    throw new Error('Autorização inválida ou já respondida');
  }

  if (autorizacao.status && autorizacao.status !== 'pendente' && autorizacao.status !== resposta) {
    throw new Error('Autorização já respondida');
  }

  if (autorizacao.expira_em && new Date(autorizacao.expira_em) < new Date()) {
    await supabase
      .from('autorizacoes_solicitacao')
      .update({ status: 'expirada' })
      .eq('id', autorizacao.id);

    throw new Error('Autorização expirada');
  }

  await atualizarSolicitacaoComFallback(autorizacao, resposta);
  await marcarAutorizacaoRespondida(autorizacao, resposta);

  return {
    ...autorizacao,
    status: resposta
  };
}

export default {
  criarAutorizacao,
  responderAutorizacao: responderAutorizacaoSeguro
};
