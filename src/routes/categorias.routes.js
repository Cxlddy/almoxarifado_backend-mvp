import express from 'express';
import categoriasController from '../controllers/categorias.controller.js';
import { autenticarUsuario, autorizarPerfis } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', autenticarUsuario, autorizarPerfis('admin', 'usuario'), categoriasController.listarCategorias);
router.post('/', autenticarUsuario, autorizarPerfis('admin'), categoriasController.criarCategoria);
router.patch('/:id', autenticarUsuario, autorizarPerfis('admin'), categoriasController.atualizarCategoria);

export default router;
