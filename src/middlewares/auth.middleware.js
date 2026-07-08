import supabase from '../database/supabase.js';

async function autenticarUsuario(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        mensagem: 'Token de autenticação não informado'
      });
    }

    const [tipo, token] = authHeader.split(' ');

    if (tipo !== 'Bearer' || !token) {
      return res.status(401).json({
        mensagem: 'Formato do token inválido'
      });
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return res.status(401).json({
        mensagem: 'Token inválido ou expirado'
      });
    }

    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('id, nome, email, perfil, setor_id, centro_custo_id, cargo, telefone, ativo')
      .eq('id', authData.user.id)
      .eq('ativo', true)
      .single();

    if (usuarioError || !usuario) {
      return res.status(403).json({
        mensagem: 'Usuário não cadastrado ou inativo no sistema'
      });
    }

    req.usuario = {
      ...usuario,
      auth_id: authData.user.id
    };

    return next();
  } catch (error) {
    console.error('Erro na autenticação:', error.message);
    return res.status(500).json({
      mensagem: 'Erro na autenticação'
    });
  }
}

function autorizarPerfis(...perfisPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        mensagem: 'Usuário não autenticado'
      });
    }

    if (!perfisPermitidos.includes(req.usuario.perfil)) {
      return res.status(403).json({
        mensagem: 'Usuário sem permissão para esta ação'
      });
    }

    return next();
  };
}

export {
  autenticarUsuario,
  autorizarPerfis
};
