import express from 'express';
import produtosController from '../controllers/produtos.controller.js';
import { autenticarUsuario, autorizarPerfis } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', produtosController.listarProdutos);

router.post(
  '/',
  autenticarUsuario,
  autorizarPerfis('admin'),
  produtosController.criarProduto
);

export default router;