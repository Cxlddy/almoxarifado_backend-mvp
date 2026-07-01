import express from 'express';
import devolucoesController from '../controllers/devolucoes.controller.js';

const router = express.Router();

router.get('/emprestimos', devolucoesController.listarEmprestimosPendentes);
router.post('/solicitar', devolucoesController.solicitarDevolucao);

router.get('/confirmar/:token', devolucoesController.telaConfirmar);
router.post('/confirmar/:token', devolucoesController.confirmarDevolucao);

router.get('/negar/:token', devolucoesController.telaNegar);
router.post('/negar/:token', devolucoesController.negarDevolucao);

export default router;