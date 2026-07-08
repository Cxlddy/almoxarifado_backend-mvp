import { normalizarTelefone } from '../utils/data.utils.js';

function formatarQuantidade(valor) {
  const numero = Number(valor || 0);
  return Number.isFinite(numero)
    ? numero.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
    : '-';
}

function formatarData(valor) {
  if (!valor) return 'Não informada';
  return new Date(valor).toLocaleString('pt-BR');
}

function montarMensagemAutorizacao({
  solicitacao,
  solicitante,
  itens = [],
  admin,
  linkAprovar,
  linkNegar
}) {
  const pessoa = solicitante || solicitacao?.usuarios || {};
  const setor = solicitacao?.setores?.nome || 'Não informado';
  const centro = solicitacao?.centros_custo
    ? `${solicitacao.centros_custo.codigo || ''} ${solicitacao.centros_custo.nome || ''}`.trim()
    : 'Não informado';

  const listaItens = itens.length
    ? itens.map((item, index) => {
        const produto = item.produtos || item.produto || {};
        const nomeProduto = produto.nome || item.produto_nome || item.nome || 'Produto não informado';
        const codigo = produto.codigo_interno || 'Sem código';
        const quantidade = formatarQuantidade(item.quantidade_solicitada || item.quantidade);
        const observacao = item.observacao ? `\n   Observação: ${item.observacao}` : '';

        return `${index + 1}) ${nomeProduto}\n   Código: ${codigo}\n   Quantidade: ${quantidade}${observacao}`;
      }).join('\n\n')
    : 'Itens não informados';

  return [
    '*Solicitação de material - Almoxarifado*',
    '',
    `Olá${admin?.nome ? `, ${admin.nome}` : ''}.`,
    'Existe uma solicitação aguardando sua análise.',
    '',
    '*Resumo da solicitação*',
    `ID: ${solicitacao.id}`,
    `Data: ${formatarData(solicitacao.data_solicitacao)}`,
    `Status: Aguardando autorização`,
    '',
    '*Solicitante*',
    `Nome: ${pessoa.nome || 'Não informado'}`,
    `Email: ${pessoa.email || 'Não informado'}`,
    `Telefone: ${pessoa.telefone || 'Não informado'}`,
    `Cargo: ${pessoa.cargo || 'Não informado'}`,
    `Setor: ${setor}`,
    `Centro de custo: ${centro}`,
    '',
    '*Itens solicitados*',
    listaItens,
    '',
    '*Justificativa*',
    solicitacao.justificativa || 'Não informada',
    '',
    '*Ação*',
    `Aprovar: ${linkAprovar}`,
    `Negar: ${linkNegar}`,
    '',
    'Você também pode aprovar ou negar diretamente na tela de Solicitações do sistema.'
  ].join('\n');
}

async function enviarMensagemWhatsapp({ telefone, mensagem }) {
  const provider = process.env.WHATSAPP_PROVIDER || 'simulado';
  const telefoneNormalizado = normalizarTelefone(telefone);

  if (!telefoneNormalizado) {
    throw new Error('Telefone de WhatsApp inválido');
  }

  if (provider === 'evolution') {
    return enviarViaEvolution({
      telefone: telefoneNormalizado,
      mensagem
    });
  }

  return {
    simulado: true,
    telefone: telefoneNormalizado,
    mensagem
  };
}

async function enviarViaEvolution({ telefone, mensagem }) {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiKey = process.env.WHATSAPP_API_KEY;
  const instance = process.env.WHATSAPP_INSTANCE;

  if (!apiUrl || !apiKey || !instance) {
    throw new Error('Evolution API não configurada nas variáveis de ambiente');
  }

  const resposta = await fetch(`${apiUrl}/message/sendText/${instance}`, {
    method: 'POST',
    headers: {
      apikey: apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      number: telefone,
      text: mensagem
    })
  });

  const resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(JSON.stringify(resultado));
  }

  return resultado;
}

export default {
  enviarMensagemWhatsapp,
  montarMensagemAutorizacao
};
