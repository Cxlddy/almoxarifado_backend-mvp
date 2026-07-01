import autorizacoesService from '../services/autorizacoes.service.js';

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

function telaAprovar(req, res) {
  const { token } = req.params;

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

    return res.send(`
      <h1>Solicitação aprovada</h1>
      <p>A autorização foi registrada com sucesso.</p>
    `);
  } catch (error) {
    return res.status(400).send(`
      <h1>Erro na autorização</h1>
      <p>${error.message}</p>
    `);
  }
}

async function negar(req, res) {
  try {
    const { token } = req.params;

    await autorizacoesService.responderAutorizacao(token, 'negada');

    return res.send(`
      <h1>Solicitação negada</h1>
      <p>A negativa foi registrada com sucesso.</p>
    `);
  } catch (error) {
    return res.status(400).send(`
      <h1>Erro na autorização</h1>
      <p>${error.message}</p>
    `);
  }
}

export default {
  telaAprovar,
  telaNegar,
  aprovar,
  negar
};