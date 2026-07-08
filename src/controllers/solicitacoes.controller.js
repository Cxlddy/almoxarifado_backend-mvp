import solicitacoesService from '../services/solicitacoes.service.js';
import { uuidValido } from '../utils/data.utils.js';

async function listarSolicitacoes(req, res) {
  try {
    const solicitacoes = await solicitacoesService.listarSolicitacoes(req.usuario);
    return res.status(200).json(solicitacoes);
  } catch (error) {
    return res.status(500).json({
      mensagem: 'Erro ao listar solicitações',
      erro: error.message
    });
  }
}

async function criarSolicitacao(req, res) {
  try {
    const {
      setor_id,
      centro_custo_id,
      justificativa,
      admin_id,
      observacao,
      itens
    } = req.body;

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({
        mensagem: 'A solicitação precisa ter pelo menos um item'
      });
    }

    const solicitacao = await solicitacoesService.criarSolicitacao(
      {
        solicitante_id: req.usuario.id,
        setor_id,
        centro_custo_id,
        justificativa,
        observacao,
        status: 'enviada'
      },
      itens,
      admin_id
    );

    return res.status(201).json(solicitacao);
  } catch (error) {
    return res.status(500).json({
      mensagem: 'Erro ao criar solicitação',
      erro: error.message
    });
  }
}

async function aprovarSolicitacao(req, res) {
  try {
    const { id } = req.params;

    if (!uuidValido(id)) {
      return res.status(400).json({ mensagem: 'Solicitação inválida' });
    }

    const solicitacao = await solicitacoesService.responderSolicitacaoPeloSistema({
      solicitacao_id: id,
      usuario_id: req.usuario.id,
      resposta: 'aprovada'
    });

    return res.status(200).json(solicitacao);
  } catch (error) {
    const status = /responsável|responsavel|pendente|inválida|invalida|respondida/i.test(error.message) ? 400 : 500;
    return res.status(status).json({
      mensagem: 'Erro ao aprovar solicitação',
      erro: error.message
    });
  }
}

async function negarSolicitacao(req, res) {
  try {
    const { id } = req.params;

    if (!uuidValido(id)) {
      return res.status(400).json({ mensagem: 'Solicitação inválida' });
    }

    const solicitacao = await solicitacoesService.responderSolicitacaoPeloSistema({
      solicitacao_id: id,
      usuario_id: req.usuario.id,
      resposta: 'negada'
    });

    return res.status(200).json(solicitacao);
  } catch (error) {
    const status = /responsável|responsavel|pendente|inválida|invalida|respondida/i.test(error.message) ? 400 : 500;
    return res.status(status).json({
      mensagem: 'Erro ao negar solicitação',
      erro: error.message
    });
  }
}

async function atenderSolicitacao(req, res) {
  try {
    const { id } = req.params;
    const { local_estoque_id } = req.body;

    if (!local_estoque_id) {
      return res.status(400).json({
        mensagem: 'O local de estoque é obrigatório'
      });
    }

    const solicitacao = await solicitacoesService.atenderSolicitacao({
      solicitacao_id: id,
      local_estoque_id,
      usuario_id: req.usuario.id
    });

    return res.status(200).json(solicitacao);
  } catch (error) {
    return res.status(500).json({
      mensagem: 'Erro ao atender solicitação',
      erro: error.message
    });
  }
}

export default {
  listarSolicitacoes,
  criarSolicitacao,
  aprovarSolicitacao,
  negarSolicitacao,
  atenderSolicitacao
};
