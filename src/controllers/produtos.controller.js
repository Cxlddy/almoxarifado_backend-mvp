import produtosService from '../services/produtos.service.js';
import { uuidValido } from '../utils/data.utils.js';

async function listarProdutos(req, res) {
  try {
    const produtos = await produtosService.listarProdutos();

    return res.status(200).json(produtos);
  } catch (error) {
    return res.status(500).json({
      mensagem: 'Erro ao listar produtos',
      erro: error.message
    });
  }
}

async function criarProduto(req, res) {
  try {
    const {
      categoria_id,
      unidade_medida_id,
      nome,
      descricao,
      codigo_interno,
      codigo_barras,
      estoque_minimo,
      estoque_maximo,
      controla_validade,
      controla_lote
    } = req.body;

    if (!nome) {
      return res.status(400).json({
        mensagem: 'O nome do produto Ã© obrigatÃ³rio'
      });
    }

    if (categoria_id && !uuidValido(categoria_id)) {
      return res.status(400).json({
        mensagem: 'Categoria invÃ¡lida'
      });
    }

    if (unidade_medida_id && !uuidValido(unidade_medida_id)) {
      return res.status(400).json({
        mensagem: 'Unidade de medida invÃ¡lida'
      });
    }

    const produto = await produtosService.criarProduto({
      categoria_id,
      unidade_medida_id,
      nome,
      descricao,
      codigo_interno,
      codigo_barras,
      estoque_minimo,
      estoque_maximo,
      controla_validade,
      controla_lote
    });

    return res.status(201).json(produto);
  } catch (error) {
    return res.status(500).json({
      mensagem: 'Erro ao criar produto',
      erro: error.message
    });
  }
}

async function atualizarProduto(req, res) {
  try {
    const { id } = req.params;
    const dados = req.body || {};

    if (!uuidValido(id)) {
      return res.status(400).json({ mensagem: 'Produto inválido' });
    }

    if (dados.categoria_id && !uuidValido(dados.categoria_id)) {
      return res.status(400).json({ mensagem: 'Categoria inválida' });
    }

    if (dados.unidade_medida_id && !uuidValido(dados.unidade_medida_id)) {
      return res.status(400).json({ mensagem: 'Unidade de medida inválida' });
    }

    const produto = await produtosService.atualizarProduto(id, dados);

    return res.status(200).json(produto);
  } catch (error) {
    return res.status(500).json({
      mensagem: 'Erro ao atualizar produto',
      erro: error.message
    });
  }
}

export default {
  listarProdutos,
  criarProduto,
  atualizarProduto
};


