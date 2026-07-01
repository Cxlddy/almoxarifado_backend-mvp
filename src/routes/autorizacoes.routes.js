import express from 'express';
import autorizacoesController from '../controllers/autorizacoes.controller.js';

const router = express.Router();

router.get('/a/:token', autorizacoesController.telaAprovar);
router.post('/a/:token', autorizacoesController.aprovar);

router.get('/n/:token', autorizacoesController.telaNegar);
router.post('/n/:token', autorizacoesController.negar);

export default router;