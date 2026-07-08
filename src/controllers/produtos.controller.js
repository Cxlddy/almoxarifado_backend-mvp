import produtosService from '../services/produtos.service.js';
import { numeroPositivo, uuidValido } from '../utils/data.utils.js';

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
      nome,
      descricao,
      codigo_interno,
      codigo_barras,
      estoque_minimo,
      estoque_maximo,
      controla_validade,
      controla_lote,
      quantidade_inicial,
      local_estoque_id
    } = req.body;

    if (!nome) {
      return res.status(400).json({
        mensagem: 'O nome do produto é obrigatório'
      });
    }

    if (categoria_id && !uuidValido(categoria_id)) {
      return res.status(400).json({
        mensagem: 'Categoria inválida'
      });
    }

    if (Number(quantidade_inicial || 0) > 0 && !uuidValido(local_estoque_id)) {
      return res.status(400).json({
        mensagem: 'Informe o local de estoque para registrar a quantidade inicial'
      });
    }

    const produto = await produtosService.criarProduto({
      categoria_id: categoria_id || null,
      nome,
      descricao,
      codigo_interno,
      codigo_barras,
      estoque_minimo,
      estoque_maximo,
      controla_validade,
      controla_lote,
      quantidade_inicial: numeroPositivo(quantidade_inicial) ? Number(quantidade_inicial) : 0,
      local_estoque_id: local_estoque_id || null,
      usuario_id: req.usuario.id
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

    const produto = await produtosService.atualizarProduto(id, dados);

    return res.status(200).json(produto);
  } catch (error) {
    return res.status(500).json({
      mensagem: 'Erro ao atualizar produto',
      erro: error.message
    });
  }
}

async function removerProduto(req, res) {
  try {
    const { id } = req.params;

    if (!uuidValido(id)) {
      return res.status(400).json({ mensagem: 'Produto inválido' });
    }

    const resultado = await produtosService.removerProduto(id);

    return res.status(200).json({
      mensagem: resultado.desativado
        ? 'Produto possui histórico e foi desativado do catálogo'
        : 'Produto excluído com sucesso',
      produto: resultado
    });
  } catch (error) {
    return res.status(500).json({
      mensagem: 'Erro ao excluir produto',
      erro: error.message
    });
  }
}

export default {
  listarProdutos,
  criarProduto,
  atualizarProduto,
  removerProduto
};
