import express from 'express';
import cors from 'cors';
import {
  hideInternalErrors,
  noStore,
  rateLimit,
  sanitizeBody,
  securityHeaders
} from './middlewares/security.middleware.js';

import categoriasRoutes from './routes/categorias.routes.js';
import produtosRoutes from './routes/produtos.routes.js';
import movimentacoesRoutes from './routes/movimentacoes.routes.js';
import saldoEstoqueRoutes from './routes/saldoEstoque.routes.js';
import solicitacoesRoutes from './routes/solicitacoes.routes.js';
import autorizacoesRoutes from './routes/autorizacoes.routes.js';
import cadastrosRoutes from './routes/cadastros.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import authRoutes from './routes/auth.routes.js';
import devolucoesRoutes from './routes/devolucoes.routes.js';


const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

const allowedOrigins = (process.env.CORS_ORIGINS || [
    'https://almoxarifado-theta.vercel.app',
    'https://almoxarifado-backend-tan.vercel.app'
  ].join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message: 'Muitas requisições. Tente novamente mais tarde.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Muitas tentativas de autenticação. Aguarde alguns minutos.'
});

const publicActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: 'Muitas tentativas. Aguarde alguns minutos.'
});

app.use(cors(corsOptions));
app.use(securityHeaders);
app.use(hideInternalErrors);
app.use(apiLimiter);

app.use(express.json({ limit: '100kb', strict: true }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(sanitizeBody);

app.use('/auth', authLimiter);
app.use(['/a', '/n', '/devolucoes/confirmar', '/devolucoes/negar'], noStore, publicActionLimiter);

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
app.use('/devolucoes', devolucoesRoutes);

app.use((req, res) => {
  res.status(404).json({ mensagem: 'Recurso não encontrado' });
});

app.use((error, req, res, next) => {
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ mensagem: 'JSON inválido' });
  }

  console.error('Erro não tratado:', error);

  return res.status(500).json({
    mensagem: 'Erro interno do servidor'
  });
});

export default app;
