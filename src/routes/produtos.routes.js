import express from 'express';
import produtosController from '../controllers/produtos.controller.js';
import { autenticarUsuario, autorizarPerfis } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/',
  autenticarUsuario,
  autorizarPerfis('admin', 'usuario'),
  produtosController.listarProdutos
);

router.post(
  '/',
  autenticarUsuario,
  autorizarPerfis('admin'),
  produtosController.criarProduto
);

router.patch(
  '/:id',
  autenticarUsuario,
  autorizarPerfis('admin'),
  produtosController.atualizarProduto
);

export default router;


