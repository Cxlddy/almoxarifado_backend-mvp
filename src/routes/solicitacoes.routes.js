import express from 'express';
import solicitacoesController from '../controllers/solicitacoes.controller.js';
import { autenticarUsuario, autorizarPerfis } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/',
  autenticarUsuario,
  autorizarPerfis('admin'),
  solicitacoesController.listarSolicitacoes
);

router.post(
  '/',
  autenticarUsuario,
  autorizarPerfis('admin', 'usuario'),
  solicitacoesController.criarSolicitacao
);

router.post(
  '/:id/atender',
  autenticarUsuario,
  autorizarPerfis('admin'),
  solicitacoesController.atenderSolicitacao
);

export default router;