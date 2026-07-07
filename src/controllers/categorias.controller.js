import categoriasService from '../services/categorias.service.js';

function responderErro(res, mensagem, error) {
  const status = /obrigatorio|invalido|valido/i.test(error.message) ? 400 : 500;
  return res.status(status).json({ mensagem, erro: error.message });
}

async function listarCategorias(req, res) {
  try {
    const categorias = await categoriasService.listarCategorias();
    return res.status(200).json(categorias);
  } catch (error) {
    return responderErro(res, 'Erro ao listar categorias', error);
  }
}

async function criarCategoria(req, res) {
  try {
    const categoria = await categoriasService.criarCategoria(req.body || {});
    return res.status(201).json(categoria);
  } catch (error) {
    return responderErro(res, 'Erro ao criar categoria', error);
  }
}

async function atualizarCategoria(req, res) {
  try {
    const categoria = await categoriasService.atualizarCategoria(req.params.id, req.body || {});
    return res.status(200).json(categoria);
  } catch (error) {
    return responderErro(res, 'Erro ao atualizar categoria', error);
  }
}

export default {
  listarCategorias,
  criarCategoria,
  atualizarCategoria
};
