import express from 'express';
import movimentacoesController from '../controllers/movimentacoes.controller.js';
import { autenticarUsuario, autorizarPerfis } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post(
  '/',
  autenticarUsuario,
  autorizarPerfis('admin'),
  movimentacoesController.criarMovimentacao
);

export default router;