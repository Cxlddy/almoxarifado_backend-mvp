import express from 'express';
import cors from 'cors';

import categoriasRoutes from './routes/categorias.routes.js';
import produtosRoutes from './routes/produtos.routes.js';
import movimentacoesRoutes from './routes/movimentacoes.routes.js';
import saldoEstoqueRoutes from './routes/saldoEstoque.routes.js';
import solicitacoesRoutes from './routes/solicitacoes.routes.js';
import autorizacoesRoutes from './routes/autorizacoes.routes.js';
import cadastrosRoutes from './routes/cadastros.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import authRoutes from './routes/auth.routes.js';


const app = express();

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mensagem: 'API do almoxarifado funcionando' });
});

app.use('/categorias', categoriasRoutes);
app.use('/produtos', produtosRoutes);
app.use('/movimentacoes', movimentacoesRoutes);
app.use('/saldo-estoque', saldoEstoqueRoutes);
app.use('/solicitacoes', solicitacoesRoutes);
app.use('/', autorizacoesRoutes);
app.use('/cadastros', cadastrosRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/auth', authRoutes);


export default app;