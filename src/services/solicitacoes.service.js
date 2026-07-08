import supabase from '../database/supabase.js';
import autorizacoesService from './autorizacoes.service.js';
import whatsappService from './whatsapp.service.js';
import { numeroPositivo, uuidValido } from '../utils/data.utils.js';

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

  return data;
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

  return data;
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

  const solicitacaoCompleta = await buscarSolicitacaoCompleta(solicitacao.id);

  try {
    await enviarAutorizacaoParaAdmin(solicitacaoCompleta, admin_id);
  } catch (error) {
    console.error('Erro ao enviar autorização por WhatsApp:', error.message);
  }

  return {
    ...solicitacaoCompleta,
    itens: itensCriados
  };
}

async function enviarAutorizacaoParaAdmin(solicitacao, admin_id) {
  const appPublicUrl = process.env.APP_PUBLIC_URL || 'http://localhost:3000';

  if (!admin_id) {
    throw new Error('Selecione um admin para receber a autorização');
  }

  const { data: admin, error } = await supabase
    .from('usuarios')
    .select('id, nome, telefone, perfil, ativo')
    .eq('id', admin_id)
    .eq('perfil', 'admin')
    .eq('ativo', true)
    .single();

  if (error || !admin) {
    throw new Error('Admin responsável não encontrado ou inativo');
  }

  if (!admin.telefone) {
    throw new Error('O admin selecionado não possui telefone cadastrado');
  }

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
