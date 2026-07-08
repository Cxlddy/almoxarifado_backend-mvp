import express from 'express';
import usuariosController from '../controllers/usuarios.controller.js';
import { autenticarUsuario, autorizarPerfis } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/admins',
  autenticarUsuario,
  autorizarPerfis('admin', 'usuario'),
  usuariosController.listarAdmins
);

router.use(autenticarUsuario);
router.use(autorizarPerfis('admin'));

router.get('/', usuariosController.listarUsuarios);
router.post('/', usuariosController.criarUsuario);
router.patch('/:id', usuariosController.atualizarUsuario);
router.delete('/:id', usuariosController.removerUsuario);

export default router;
