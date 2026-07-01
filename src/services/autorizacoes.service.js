import crypto from 'crypto';
import supabase from '../database/supabase.js';

function gerarTokenCurto() {
  return crypto.randomBytes(6).toString('base64url');
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
    .eq('status', 'pendente')
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

  const { error: erroSolicitacao } = await supabase
    .from('solicitacoes')
    .update({
      status: novoStatusSolicitacao,
      data_aprovacao: resposta === 'aprovada' ? new Date().toISOString() : null,
      aprovado_por: autorizacao.almoxarife_id
    })
    .eq('id', autorizacao.solicitacao_id);

  if (erroSolicitacao) {
    throw new Error(erroSolicitacao.message);
  }

  const { data, error } = await supabase
    .from('autorizacoes_solicitacao')
    .update({
      status: resposta,
      respondido_em: new Date().toISOString()
    })
    .eq('id', autorizacao.id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export default {
  criarAutorizacao,
  responderAutorizacao
};