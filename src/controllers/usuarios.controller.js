import usuariosService from '../services/usuarios.service.js';

async function listarUsuarios(req, res) {
  try {
    const usuarios = await usuariosService.listarUsuarios();
    return res.status(200).json(usuarios);
  } catch (error) {
    return res.status(500).json({
      mensagem: 'Erro ao listar usuários',
      erro: error.message
    });
  }
}

async function criarUsuario(req, res) {
  try {
    const {
      nome,
      email,
      senha,
      perfil,
      setor_id,
      centro_custo_id,
      cargo,
      telefone,
      ativo
    } = req.body;

    if (!nome) {
      return res.status(400).json({
        mensagem: 'O nome do usuário é obrigatório'
      });
    }

    if (!email) {
      return res.status(400).json({
        mensagem: 'O email do usuário é obrigatório'
      });
    }

    if (!telefone) {
      return res.status(400).json({
        mensagem: 'O telefone do usuário é obrigatório'
      });
    }

    if (!senha || String(senha).length < 8) {
      return res.status(400).json({
        mensagem: 'A senha inicial deve ter pelo menos 8 caracteres'
      });
    }

    const usuario = await usuariosService.criarUsuario({
      nome,
      email,
      senha,
      perfil,
      setor_id,
      centro_custo_id,
      cargo,
      telefone,
      ativo
    });

    return res.status(201).json(usuario);
  } catch (error) {
    return res.status(500).json({
      mensagem: 'Erro ao criar usuário',
      erro: error.message
    });
  }
}

async function atualizarUsuario(req, res) {
  try {
    const { id } = req.params;

    const usuario = await usuariosService.atualizarUsuario(id, req.body);

    return res.status(200).json(usuario);
  } catch (error) {
    return res.status(500).json({
      mensagem: 'Erro ao atualizar usuário',
      erro: error.message
    });
  }
}

async function removerUsuario(req, res) {
  try {
    const { id } = req.params;
    const usuario = await usuariosService.removerUsuario(id, req.usuario);

    return res.status(200).json({
      mensagem: 'Usuário excluído com sucesso',
      usuario
    });
  } catch (error) {
    const status = /próprio|proprio|não encontrado|nao encontrado|inválido|invalido/i.test(error.message) ? 400 : 500;

    return res.status(status).json({
      mensagem: 'Erro ao excluir usuário',
      erro: error.message
    });
  }
}

async function listarAdmins(req, res) {
  try {
    const admins = await usuariosService.listarAdmins();
    return res.status(200).json(admins);
  } catch (error) {
    return res.status(500).json({
      mensagem: 'Erro ao listar admins',
      erro: error.message
    });
  }
}

export default {
  listarUsuarios,
  listarAdmins,
  criarUsuario,
  atualizarUsuario,
  removerUsuario
};




