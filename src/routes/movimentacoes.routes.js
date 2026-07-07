import express from 'express';
import movimentacoesController from '../controllers/movimentacoes.controller.js';
import { autenticarUsuario, autorizarPerfis } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/',
  autenticarUsuario,
  autorizarPerfis('admin', 'usuario'),
  movimentacoesController.listarMovimentacoes
);

router.post(
  '/',
  autenticarUsuario,
  autorizarPerfis('admin'),
  movimentacoesController.criarMovimentacao
);

export default router;
