import supabase from '../database/supabase.js';
import { pick } from '../utils/data.utils.js';

const tabelasPermitidas = [
  'setores',
  'centros_custo',
  'locais_estoque',
  'fornecedores',
  'unidades_medida'
];

const camposPermitidosPorTabela = {
  setores: ['nome', 'descricao', 'ativo'],
  centros_custo: ['codigo', 'nome', 'descricao', 'ativo'],
  locais_estoque: ['nome', 'descricao', 'ativo'],
  fornecedores: ['nome', 'cnpj', 'telefone', 'email', 'ativo'],
  unidades_medida: ['nome', 'sigla', 'ativo']
};

function validarTabela(tabela) {
  if (!tabelasPermitidas.includes(tabela)) {
    throw new Error('Tabela não permitida');
  }
}

async function listar(tabela) {
  validarTabela(tabela);

  const { data, error } = await supabase
    .from(tabela)
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function criar(tabela, dados) {
  validarTabela(tabela);

  if (!dados.nome) {
    throw new Error('O campo nome é obrigatório');
  }

  const dadosSeguros = pick(dados, camposPermitidosPorTabela[tabela] || []);

  const { data, error } = await supabase
    .from(tabela)
    .insert([dadosSeguros])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export default {
  listar,
  criar
};
