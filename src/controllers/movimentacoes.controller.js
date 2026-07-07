import movimentacoesService from '../services/movimentacoes.service.js';
import { numeroPositivo, uuidValido } from '../utils/data.utils.js';

async function listarMovimentacoes(req, res) {
  try {
    const movimentacoes = await movimentacoesService.listarMovimentacoes();
    return res.status(200).json(movimentacoes);
  } catch (error) {
    return res.status(500).json({
      mensagem: 'Erro ao listar movimentacoes',
      erro: error.message
    });
  }
}

async function criarMovimentacao(req, res) {
  try {
    const {
      produto_id,
      local_estoque_id,
      fornecedor_id,
      tipo,
      origem,
      quantidade,
      lote,
      data_validade,
      documento,
      observacao
    } = req.body || {};

    if (!produto_id || !uuidValido(produto_id)) {
      return res.status(400).json({ mensagem: 'O produto e obrigatorio' });
    }

    if (!local_estoque_id || !uuidValido(local_estoque_id)) {
      return res.status(400).json({ mensagem: 'O local de estoque e obrigatorio' });
    }

    if (!['entrada', 'saida'].includes(tipo)) {
      return res.status(400).json({ mensagem: 'O tipo da movimentacao e obrigatorio' });
    }

    if (!numeroPositivo(quantidade)) {
      return res.status(400).json({ mensagem: 'A quantidade deve ser maior que zero' });
    }

    const movimentacao = await movimentacoesService.criarMovimentacao({
      produto_id,
      local_estoque_id,
      usuario_id: req.usuario.id,
      fornecedor_id: fornecedor_id || null,
      tipo,
      origem: origem || 'manual',
      quantidade: Number(quantidade),
      lote: lote || null,
      data_validade: data_validade || null,
      documento: documento || null,
      observacao: observacao || null
    });

    return res.status(201).json(movimentacao);
  } catch (error) {
    return res.status(500).json({
      mensagem: 'Erro ao criar movimentacao de estoque',
      erro: error.message
    });
  }
}

export default {
  listarMovimentacoes,
  criarMovimentacao
};
