function montarMensagemAutorizacao({
  solicitacao,
  itens = [],
  linkAprovar,
  linkNegar
}) {
  const listaItens = itens.length
    ? itens.map((item, index) => {
        const nomeProduto =
          item.produto_nome ||
          item.produtos?.nome ||
          item.nome ||
          'Produto não informado';

        const quantidade =
          item.quantidade_solicitada ||
          item.quantidade ||
          '-';

        return `${index + 1}. ${nomeProduto} — Qtd: ${quantidade}`;
      }).join('\n')
    : 'Itens não informados';

  return `
📦 *Nova Solicitação de Material*

Foi feita uma nova solicitação no sistema:

━━━━━━━━━━━━━━━━━━━━

🧾 *Solicitação*
ID: ${solicitacao.id}

📌 *Status*
Aguardando autorização

📝 *Justificativa*
${solicitacao.justificativa || 'Não informada'}

💬 *Observação*
${solicitacao.observacao || 'Não informada'}

━━━━━━━━━━━━━━━━━━━━

📋 *Itens solicitados*
${listaItens}

━━━━━━━━━━━━━━━━━━━━

✅ *Aprovar solicitação*
${linkAprovar}

❌ *Negar solicitação*
${linkNegar}

━━━━━━━━━━━━━━━━━━━━

⚠️ Esta autorização é individual e deve ser realizada apenas pelo responsável do almoxarifado.
`.trim();
}

async function enviarMensagemWhatsapp({ telefone, mensagem }) {
  const provider = process.env.WHATSAPP_PROVIDER || 'simulado';

  if (provider === 'evolution') {
    return enviarViaEvolution({
      telefone,
      mensagem
    });
  }

  return {
    simulado: true,
    telefone,
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