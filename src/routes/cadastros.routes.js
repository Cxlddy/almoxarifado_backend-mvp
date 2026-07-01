import express from 'express';
import cadastrosController from '../controllers/cadastros.controller.js';
import { autenticarUsuario, autorizarPerfis } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/setores', cadastrosController.listarSetores);
router.get('/centros-custo', cadastrosController.listarCentrosCusto);
router.get('/locais-estoque', cadastrosController.listarLocaisEstoque);
router.get('/fornecedores', cadastrosController.listarFornecedores);
router.get('/unidades-medida', cadastrosController.listarUnidadesMedida);

router.post(
  '/setores',
  autenticarUsuario,
  autorizarPerfis('admin'),
  cadastrosController.criarSetor
);

router.post(
  '/centros-custo',
  autenticarUsuario,
  autorizarPerfis('admin'),
  cadastrosController.criarCentroCusto
);

router.post(
  '/locais-estoque',
  autenticarUsuario,
  autorizarPerfis('admin'),
  cadastrosController.criarLocalEstoque
);

router.post(
  '/fornecedores',
  autenticarUsuario,
  autorizarPerfis('admin'),
  cadastrosController.criarFornecedor
);

export default router;