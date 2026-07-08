import cadastrosService from '../services/cadastros.service.js';

function responderErro(res, mensagem, error) {
  const status = /obrigatorio|invalido|permitida|valido/i.test(error.message) ? 400 : 500;
  return res.status(status).json({ mensagem, erro: error.message });
}

function listar(tabela, mensagemErro) {
  return async function listarCadastro(req, res) {
    try {
      const dados = await cadastrosService.listar(tabela);
      return res.status(200).json(dados);
    } catch (error) {
      return responderErro(res, mensagemErro, error);
    }
  };
}

function criar(tabela, mensagemErro) {
  return async function criarCadastro(req, res) {
    try {
      const item = await cadastrosService.criar(tabela, req.body || {});
      return res.status(201).json(item);
    } catch (error) {
      return responderErro(res, mensagemErro, error);
    }
  };
}

function atualizar(tabela, mensagemErro) {
  return async function atualizarCadastro(req, res) {
    try {
      const item = await cadastrosService.atualizar(tabela, req.params.id, req.body || {});
      return res.status(200).json(item);
    } catch (error) {
      return responderErro(res, mensagemErro, error);
    }
  };
}

function remover(tabela, mensagemErro) {
  return async function removerCadastro(req, res) {
    try {
      await cadastrosService.remover(tabela, req.params.id);
      return res.status(200).json({ mensagem: 'Cadastro excluido com sucesso' });
    } catch (error) {
      return responderErro(res, mensagemErro, error);
    }
  };
}
export default {
  listarSetores: listar('setores', 'Erro ao listar setores'),
  criarSetor: criar('setores', 'Erro ao criar setor'),
  atualizarSetor: atualizar('setores', 'Erro ao atualizar setor'),
  removerSetor: remover('setores', 'Erro ao excluir setor'),
  listarCentrosCusto: listar('centros_custo', 'Erro ao listar centros de custo'),
  criarCentroCusto: criar('centros_custo', 'Erro ao criar centro de custo'),
  atualizarCentroCusto: atualizar('centros_custo', 'Erro ao atualizar centro de custo'),
  removerCentroCusto: remover('centros_custo', 'Erro ao excluir centro de custo'),
  listarLocaisEstoque: listar('locais_estoque', 'Erro ao listar locais de estoque'),
  criarLocalEstoque: criar('locais_estoque', 'Erro ao criar local de estoque'),
  atualizarLocalEstoque: atualizar('locais_estoque', 'Erro ao atualizar local de estoque'),
  removerLocalEstoque: remover('locais_estoque', 'Erro ao excluir local de estoque'),
  listarFornecedores: listar('fornecedores', 'Erro ao listar fornecedores'),
  criarFornecedor: criar('fornecedores', 'Erro ao criar fornecedor'),
  atualizarFornecedor: atualizar('fornecedores', 'Erro ao atualizar fornecedor'),
  removerFornecedor: remover('fornecedores', 'Erro ao excluir fornecedor'),
  listarUnidadesMedida: listar('unidades_medida', 'Erro ao listar unidades de medida'),
  criarUnidadeMedida: criar('unidades_medida', 'Erro ao criar unidade de medida'),
  atualizarUnidadeMedida: atualizar('unidades_medida', 'Erro ao atualizar unidade de medida'),
  removerUnidadeMedida: remover('unidades_medida', 'Erro ao excluir unidade de medida')
};

