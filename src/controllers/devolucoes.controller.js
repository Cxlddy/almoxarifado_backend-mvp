import devolucoesService from '../services/devolucoes.service.js';

function paginaConfirmacao({ tipo, token, titulo, mensagem }) {
  const action = tipo === 'confirmar'
    ? `/devolucoes/confirmar/${token}`
    : `/devolucoes/negar/${token}`;

  const cor = tipo === 'confirmar' ? '#16a34a' : '#dc2626';
  const textoBotao = tipo === 'confirmar' ? 'Confirmar devolução' : 'Negar devolução';

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${titulo}</title>
      <style>
        body {
          margin: 0;
          min-height: 100vh;
          font-family: Arial, Helvetica, sans-serif;
          background: linear-gradient(135deg, #f8fafc, #e0e7ff);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          color: #0f172a;
        }

        .card {
          width: 100%;
          max-width: 520px;
          background: #fff;
          border-radius: 22px;
          padding: 34px;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.16);
          text-align: center;
        }

        h1 {
          margin: 0 0 12px;
          font-size: 28px;
        }

        p {
          margin: 0 0 24px;
          color: #475569;
          line-height: 1.6;
        }

        button {
          border: 0;
          border-radius: 13px;
          min-height: 48px;
          padding: 0 22px;
          background: ${cor};
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          width: 100%;
        }
      </style>
    </head>
    <body>
      <main class="card">
        <h1>${titulo}</h1>
        <p>${mensagem}</p>

        <form method="POST" action="${action}">
          <button type="submit">${textoBotao}</button>
        </form>
      </main>
    </body>
    </html>
  `;
}

function paginaResultado({ tipo, titulo, mensagem }) {
  const visual = {
    confirmada: {
      cor: '#16a34a',
      fundo: '#ecfdf5',
      icone: '✓',
      label: 'Devolução confirmada'
    },
    negada: {
      cor: '#dc2626',
      fundo: '#fef2f2',
      icone: '×',
      label: 'Devolução negada'
    },
    erro: {
      cor: '#d97706',
      fundo: '#fffbeb',
      icone: '!',
      label: 'Erro'
    }
  }[tipo] || {
    cor: '#d97706',
    fundo: '#fffbeb',
    icone: '!',
    label: 'Erro'
  };

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${titulo}</title>
      <style>
        body {
          margin: 0;
          min-height: 100vh;
          font-family: Arial, Helvetica, sans-serif;
          background: linear-gradient(135deg, #f8fafc, #e0e7ff);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          color: #0f172a;
        }

        .card {
          width: 100%;
          max-width: 520px;
          background: #fff;
          border-radius: 22px;
          padding: 36px;
          text-align: center;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.16);
        }

        .icon {
          width: 84px;
          height: 84px;
          margin: 0 auto 22px;
          border-radius: 50%;
          background: ${visual.fundo};
          color: ${visual.cor};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: 800;
        }

        .badge {
          display: inline-block;
          margin-bottom: 14px;
          padding: 7px 14px;
          border-radius: 999px;
          background: ${visual.fundo};
          color: ${visual.cor};
          font-size: 13px;
          font-weight: 700;
        }

        h1 {
          margin: 0 0 12px;
          font-size: 28px;
        }

        p {
          margin: 0;
          color: #475569;
          line-height: 1.6;
        }

        button {
          margin-top: 28px;
          border: 0;
          border-radius: 13px;
          min-height: 48px;
          padding: 0 22px;
          background: #2563eb;
          color: #fff;
          font-weight: 700;
          cursor: pointer;
        }

        @media (max-width: 480px) {
          button {
            width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <main class="card">
        <div class="icon">${visual.icone}</div>
        <div class="badge">${visual.label}</div>
        <h1>${titulo}</h1>
        <p>${mensagem}</p>
        <button onclick="window.history.back()">Voltar ao sistema</button>
      </main>
    </body>
    </html>
  `;
}

async function listarEmprestimosPendentes(req, res) {
  try {
    const emprestimos = await devolucoesService.listarEmprestimosPendentes();
    return res.status(200).json(emprestimos);
  } catch (error) {
    return res.status(500).json({
      mensagem: 'Erro ao listar empréstimos pendentes',
      erro: error.message
    });
  }
}

async function solicitarDevolucao(req, res) {
  try {
    const devolucao = await devolucoesService.solicitarDevolucao(req.body);
    return res.status(201).json(devolucao);
  } catch (error) {
    return res.status(500).json({
      mensagem: 'Erro ao solicitar devolução',
      erro: error.message
    });
  }
}

async function telaConfirmar(req, res) {
  return res.send(
    paginaConfirmacao({
      tipo: 'confirmar',
      token: req.params.token,
      titulo: 'Confirmar devolução',
      mensagem: 'Confirme somente se o item foi realmente devolvido ao almoxarifado.'
    })
  );
}

async function telaNegar(req, res) {
  return res.send(
    paginaConfirmacao({
      tipo: 'negar',
      token: req.params.token,
      titulo: 'Negar devolução',
      mensagem: 'Use esta opção se o item não foi devolvido ou se há alguma divergência.'
    })
  );
}

async function confirmarDevolucao(req, res) {
  try {
    await devolucoesService.confirmarDevolucao(req.params.token);

    return res.send(
      paginaResultado({
        tipo: 'confirmada',
        titulo: 'Devolução confirmada',
        mensagem: 'A entrada do item foi registrada no estoque com sucesso.'
      })
    );
  } catch (error) {
    return res.status(400).send(
      paginaResultado({
        tipo: 'erro',
        titulo: 'Não foi possível confirmar',
        mensagem: error.message
      })
    );
  }
}

async function negarDevolucao(req, res) {
  try {
    await devolucoesService.negarDevolucao(req.params.token);

    return res.send(
      paginaResultado({
        tipo: 'negada',
        titulo: 'Devolução negada',
        mensagem: 'A devolução foi negada. Nenhuma entrada foi registrada no estoque.'
      })
    );
  } catch (error) {
    return res.status(400).send(
      paginaResultado({
        tipo: 'erro',
        titulo: 'Não foi possível negar',
        mensagem: error.message
      })
    );
  }
}

export default {
  listarEmprestimosPendentes,
  solicitarDevolucao,
  telaConfirmar,
  confirmarDevolucao,
  telaNegar,
  negarDevolucao
};