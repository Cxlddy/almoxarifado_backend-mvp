import autorizacoesService from '../services/autorizacoes.service.js';

function tokenValido(token) {
  return /^[A-Za-z0-9_-]{8,128}$/.test(token || '');
}

function paginaConfirmacao({ titulo, texto, action, botao, cor }) {
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
          display: grid;
          place-items: center;
          font-family: Arial, sans-serif;
          background: #f4f7fb;
          color: #0f172a;
          padding: 20px;
        }

        .card {
          width: 100%;
          max-width: 420px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 28px;
          text-align: center;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
        }

        h1 {
          margin: 0 0 10px;
          font-size: 24px;
        }

        p {
          color: #64748b;
          line-height: 1.5;
        }

        button {
          width: 100%;
          border: 0;
          border-radius: 8px;
          background: ${cor};
          color: white;
          padding: 13px;
          font-weight: 700;
          cursor: pointer;
          font-size: 16px;
        }
      </style>
      <script>
        window.si = window.si || function () {
          (window.siq = window.siq || []).push(arguments);
        };
      </script>
      <script defer src="/_vercel/speed-insights/script.js"></script>
    </head>
    <body>
      <main class="card">
        <h1>${titulo}</h1>
        <p>${texto}</p>

        <form method="POST" action="${action}">
          <button type="submit">${botao}</button>
        </form>
      </main>
    </body>
    </html>
  `;
}

function paginaResultadoAutorizacao({ tipo, titulo, mensagem, detalhe }) {
  const estilos = {
    aprovado: {
      cor: '#16a34a',
      fundo: '#ecfdf5',
      icone: '✓',
      texto: 'Autorizado'
    },
    negado: {
      cor: '#dc2626',
      fundo: '#fef2f2',
      icone: '×',
      texto: 'Negado'
    },
    erro: {
      cor: '#d97706',
      fundo: '#fffbeb',
      icone: '!',
      texto: 'Erro'
    }
  };

  const visual = estilos[tipo] || estilos.erro;

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${titulo}</title>
      <style>
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          min-height: 100vh;
          font-family: Arial, Helvetica, sans-serif;
          background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          color: #0f172a;
        }

        .card {
          width: 100%;
          max-width: 520px;
          background: #ffffff;
          border-radius: 22px;
          padding: 36px;
          text-align: center;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.16);
          border: 1px solid #e2e8f0;
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
          line-height: 1.2;
        }

        p {
          margin: 0;
          color: #475569;
          font-size: 16px;
          line-height: 1.6;
        }

        .detalhe {
          margin-top: 18px;
          padding: 14px;
          border-radius: 14px;
          background: #f8fafc;
          color: #64748b;
          font-size: 14px;
        }

        .actions {
          margin-top: 30px;
          display: flex;
          justify-content: center;
        }

        button {
          border: 0;
          min-height: 48px;
          padding: 0 22px;
          border-radius: 13px;
          background: #2563eb;
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 12px 26px rgba(37, 99, 235, 0.25);
        }

        button:hover {
          background: #1d4ed8;
        }

        @media (max-width: 480px) {
          .card {
            padding: 28px 20px;
            border-radius: 18px;
          }

          h1 {
            font-size: 24px;
          }

          button {
            width: 100%;
          }
        }
      </style>
      <script>
        window.si = window.si || function () {
          (window.siq = window.siq || []).push(arguments);
        };
      </script>
      <script defer src="/_vercel/speed-insights/script.js"></script>
    </head>
    <body>
      <main class="card">
        <div class="icon">${visual.icone}</div>
        <div class="badge">${visual.texto}</div>

        <h1>${titulo}</h1>
        <p>${mensagem}</p>

        ${detalhe ? `<div class="detalhe">${detalhe}</div>` : ''}

        <div class="actions">
          <button onclick="window.history.back()">Voltar ao sistema</button>
        </div>
      </main>
    </body>
    </html>
  `;
}

function telaAprovar(req, res) {
  const { token } = req.params;

  if (!tokenValido(token)) {
    return res.status(400).send(paginaResultadoAutorizacao({
      tipo: 'erro',
      titulo: 'Link inválido',
      mensagem: 'Esse link de autorização não é válido.'
    }));
  }

  return res.send(
    paginaConfirmacao({
      titulo: 'Confirmar autorização',
      texto: 'Clique no botão abaixo para aprovar esta solicitação.',
      action: `/a/${token}`,
      botao: 'Aprovar solicitação',
      cor: '#15803d'
    })
  );
}

function telaNegar(req, res) {
  const { token } = req.params;

  if (!tokenValido(token)) {
    return res.status(400).send(paginaResultadoAutorizacao({
      tipo: 'erro',
      titulo: 'Link inválido',
      mensagem: 'Esse link de autorização não é válido.'
    }));
  }

  return res.send(
    paginaConfirmacao({
      titulo: 'Negar autorização',
      texto: 'Clique no botão abaixo para negar esta solicitação.',
      action: `/n/${token}`,
      botao: 'Negar solicitação',
      cor: '#b91c1c'
    })
  );
}

async function aprovar(req, res) {
  try {
    const { token } = req.params;

    await autorizacoesService.responderAutorizacao(token, 'aprovada');

    return res.send(paginaResultadoAutorizacao({
      tipo: 'aprovado',
      titulo: 'Solicitação autorizada',
      mensagem: 'A solicitação foi aprovada com sucesso!'
    }));
  } catch (error) {
    return res.status(400).send(paginaResultadoAutorizacao({
      tipo: 'erro',
      titulo: 'Não foi possível concluir',
      mensagem: 'Esse link pode estar inválido, expirado ou já ter sido utilizado',
      detalhe: error.message
    }));
  }
}

async function negar(req, res) {
  try {
    const { token } = req.params;

    await autorizacoesService.responderAutorizacao(token, 'negada');

    return res.send(paginaResultadoAutorizacao({
      tipo: 'negado',
      titulo: 'Solicitação negada',
      mensagem: 'A solicitação foi negada com sucesso'
    }));
  } catch (error) {
    return res.status(400).send(paginaResultadoAutorizacao({
      tipo: 'erro',
      titulo: 'Não foi possível concluir',
      mensagem: 'Esse link pode estar inválido, expirado ou já ter sido utilizado',
      detalhe: error.message
    }));
  }
}

export default {
  telaAprovar,
  telaNegar,
  aprovar,
  negar
};
