import authService from '../services/auth.service.js';

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
}

async function login(req, res) {
  try {
    const { identificador, telefone, email, senha } = req.body;
    const loginId = identificador || telefone || email;

    if (!loginId || !senha) {
      return res.status(400).json({
        mensagem: 'Telefone e senha são obrigatórios'
      });
    }

    const resultado = await authService.login(loginId, senha);

    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(401).json({
      mensagem: 'Telefone ou senha inválidos'
    });
  }
}

async function logout(req, res) {
  return res.status(200).json({
    mensagem: 'Logout realizado com sucesso'
  });
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email || !emailValido(email)) {
      return res.status(400).json({
        mensagem: 'Email válido é obrigatório'
      });
    }

    await authService.forgotPassword(email);

    return res.status(200).json({
      mensagem: 'Se o email estiver cadastrado, as instruções serão enviadas.'
    });
  } catch (error) {
    console.error('Erro ao solicitar recuperação de senha:', error.message);

    return res.status(200).json({
      mensagem: 'Se o email estiver cadastrado, as instruções serão enviadas.'
    });
  }
}

async function resetPassword(req, res) {
  try {
    const { access_token, refresh_token, senha } = req.body;

    if (!access_token || !refresh_token || !senha || String(senha).length < 8) {
      return res.status(400).json({
        mensagem: 'Tokens e uma senha com pelo menos 8 caracteres são obrigatórios'
      });
    }

    await authService.resetPassword({
      access_token,
      refresh_token,
      senha
    });

    return res.status(200).json({
      mensagem: 'Senha redefinida com sucesso'
    });
  } catch (error) {
    return res.status(500).json({
      mensagem: 'Não foi possível redefinir a senha'
    });
  }
}

export default {
  login,
  logout,
  forgotPassword,
  resetPassword
};
