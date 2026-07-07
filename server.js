import 'dotenv/config';
import app from './src/app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.info(`Servidor rodando na porta ${PORT}`);
});
