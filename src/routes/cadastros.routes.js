import express from 'express';
import cadastrosController from '../controllers/cadastros.controller.js';
import { autenticarUsuario, autorizarPerfis } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/setores', autenticarUsuario, autorizarPerfis('admin', 'usuario'), cadastrosController.listarSetores);
router.get('/centros-custo', autenticarUsuario, autorizarPerfis('admin', 'usuario'), cadastrosController.listarCentrosCusto);
router.get('/locais-estoque', autenticarUsuario, autorizarPerfis('admin', 'usuario'), cadastrosController.listarLocaisEstoque);
router.get('/fornecedores', autenticarUsuario, autorizarPerfis('admin'), cadastrosController.listarFornecedores);
router.get('/unidades-medida', autenticarUsuario, autorizarPerfis('admin', 'usuario'), cadastrosController.listarUnidadesMedida);

router.post('/setores', autenticarUsuario, autorizarPerfis('admin'), cadastrosController.criarSetor);
router.post('/centros-custo', autenticarUsuario, autorizarPerfis('admin'), cadastrosController.criarCentroCusto);
router.post('/locais-estoque', autenticarUsuario, autorizarPerfis('admin'), cadastrosController.criarLocalEstoque);
router.post('/fornecedores', autenticarUsuario, autorizarPerfis('admin'), cadastrosController.criarFornecedor);
router.post('/unidades-medida', autenticarUsuario, autorizarPerfis('admin'), cadastrosController.criarUnidadeMedida);

router.patch('/setores/:id', autenticarUsuario, autorizarPerfis('admin'), cadastrosController.atualizarSetor);
router.patch('/centros-custo/:id', autenticarUsuario, autorizarPerfis('admin'), cadastrosController.atualizarCentroCusto);
router.patch('/locais-estoque/:id', autenticarUsuario, autorizarPerfis('admin'), cadastrosController.atualizarLocalEstoque);
router.patch('/fornecedores/:id', autenticarUsuario, autorizarPerfis('admin'), cadastrosController.atualizarFornecedor);
router.patch('/unidades-medida/:id', autenticarUsuario, autorizarPerfis('admin'), cadastrosController.atualizarUnidadeMedida);

router.delete('/setores/:id', autenticarUsuario, autorizarPerfis('admin'), cadastrosController.removerSetor);
router.delete('/centros-custo/:id', autenticarUsuario, autorizarPerfis('admin'), cadastrosController.removerCentroCusto);
router.delete('/locais-estoque/:id', autenticarUsuario, autorizarPerfis('admin'), cadastrosController.removerLocalEstoque);
router.delete('/fornecedores/:id', autenticarUsuario, autorizarPerfis('admin'), cadastrosController.removerFornecedor);
router.delete('/unidades-medida/:id', autenticarUsuario, autorizarPerfis('admin'), cadastrosController.removerUnidadeMedida);

export default router;

