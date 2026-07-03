import cadastrosService from '../services/cadastros.service.js';

async function listarSetores(req, res) {
  try {
    const dados = await cadastrosService.listar('setores');
    return res.status(200).json(dados);
  } catch (error) {
    return res.status(500).json({ mensagem: 'Erro ao listar setores', erro: error.message });
  }
}

async function criarSetor(req, res) {
  try {
    const setor = await cadastrosService.criar('setores', req.body);
    return res.status(201).json(setor);
  } catch (error) {
    return res.status(500).json({ mensagem: 'Erro ao criar setor', erro: error.message });
  }
}

async function listarCentrosCusto(req, res) {
  try {
    const dados = await cadastrosService.listar('centros_custo');
    return res.status(200).json(dados);
  } catch (error) {
    return res.status(500).json({ mensagem: 'Erro ao listar centros de custo', erro: error.message });
  }
}

async function criarCentroCusto(req, res) {
  try {
    const centro = await cadastrosService.criar('centros_custo', req.body);
    return res.status(201).json(centro);
  } catch (error) {
    return res.status(500).json({ mensagem: 'Erro ao criar centro de custo', erro: error.message });
  }
}

async function listarLocaisEstoque(req, res) {
  try {
    const dados = await cadastrosService.listar('locais_estoque');
    return res.status(200).json(dados);
  } catch (error) {
    return res.status(500).json({ mensagem: 'Erro ao listar locais de estoque', erro: error.message });
  }
}

async function criarLocalEstoque(req, res) {
  try {
    const local = await cadastrosService.criar('locais_estoque', req.body);
    return res.status(201).json(local);
  } catch (error) {
    return res.status(500).json({ mensagem: 'Erro ao criar local de estoque', erro: error.message });
  }
}

async function listarFornecedores(req, res) {
  try {
    const dados = await cadastrosService.listar('fornecedores');
    return res.status(200).json(dados);
  } catch (error) {
    return res.status(500).json({ mensagem: 'Erro ao listar fornecedores', erro: error.message });
  }
}

async function criarFornecedor(req, res) {
  try {
    const fornecedor = await cadastrosService.criar('fornecedores', req.body);
    return res.status(201).json(fornecedor);
  } catch (error) {
    return res.status(500).json({ mensagem: 'Erro ao criar fornecedor', erro: error.message });
  }
}

async function listarUnidadesMedida(req, res) {
  try {
    const dados = await cadastrosService.listar('unidades_medida');
    return res.status(200).json(dados);
  } catch (error) {
    return res.status(500).json({ mensagem: 'Erro ao listar unidades de medida', erro: error.message });
  }
}

async function criarUnidadeMedida(req, res) {
  try {
    const unidade = await cadastrosService.criar('unidades_medida', req.body);
    return res.status(201).json(unidade);
  } catch (error) {
    return res.status(500).json({ mensagem: 'Erro ao criar unidade de medida', erro: error.message });
  }
}

export default {
  listarSetores,
  criarSetor,
  listarCentrosCusto,
  criarCentroCusto,
  listarLocaisEstoque,
  criarLocalEstoque,
  listarFornecedores,
  criarFornecedor,
  listarUnidadesMedida,
  criarUnidadeMedida
};
