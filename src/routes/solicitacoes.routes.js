import express from 'express';
import solicitacoesController from '../controllers/solicitacoes.controller.js';
import { autenticarUsuario, autorizarPerfis } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/',
  autenticarUsuario,
  autorizarPerfis('admin', 'usuario'),
  solicitacoesController.listarSolicitacoes
);

router.post(
  '/',
  autenticarUsuario,
  autorizarPerfis('admin', 'usuario'),
  solicitacoesController.criarSolicitacao
);

router.post(
  '/:id/aprovar',
  autenticarUsuario,
  autorizarPerfis('admin'),
  solicitacoesController.aprovarSolicitacao
);

router.post(
  '/:id/negar',
  autenticarUsuario,
  autorizarPerfis('admin'),
  solicitacoesController.negarSolicitacao
);

router.post(
  '/:id/atender',
  autenticarUsuario,
  autorizarPerfis('admin'),
  solicitacoesController.atenderSolicitacao
);

export default router;
