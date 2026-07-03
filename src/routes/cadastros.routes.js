import express from 'express';
import cadastrosController from '../controllers/cadastros.controller.js';
import { autenticarUsuario, autorizarPerfis } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/setores', autenticarUsuario, autorizarPerfis('admin', 'usuario'), cadastrosController.listarSetores);
router.get('/centros-custo', autenticarUsuario, autorizarPerfis('admin', 'usuario'), cadastrosController.listarCentrosCusto);
router.get('/locais-estoque', autenticarUsuario, autorizarPerfis('admin', 'usuario'), cadastrosController.listarLocaisEstoque);
router.get('/fornecedores', autenticarUsuario, autorizarPerfis('admin'), cadastrosController.listarFornecedores);
router.get('/unidades-medida', autenticarUsuario, autorizarPerfis('admin', 'usuario'), cadastrosController.listarUnidadesMedida);

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

router.post(
  '/unidades-medida',
  autenticarUsuario,
  autorizarPerfis('admin'),
  cadastrosController.criarUnidadeMedida
);

export default router;
