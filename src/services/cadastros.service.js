import supabase from '../database/supabase.js';
import { pick, uuidValido } from '../utils/data.utils.js';

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
    throw new Error('Tabela nao permitida');
  }
}

function validarId(id) {
  if (!uuidValido(id)) {
    throw new Error('Identificador invalido');
  }
}

function prepararDados(tabela, dados, { parcial = false } = {}) {
  const dadosSeguros = pick(dados, camposPermitidosPorTabela[tabela] || []);

  if (!parcial && !dadosSeguros.nome) {
    throw new Error('O campo nome e obrigatorio');
  }

  if (Object.prototype.hasOwnProperty.call(dadosSeguros, 'ativo')) {
    dadosSeguros.ativo = dadosSeguros.ativo === true || dadosSeguros.ativo === 'true' || dadosSeguros.ativo === 1 || dadosSeguros.ativo === '1';
  }

  if (dadosSeguros.sigla) {
    dadosSeguros.sigla = String(dadosSeguros.sigla).trim().toUpperCase().slice(0, 2);
  }

  Object.keys(dadosSeguros).forEach((campo) => {
    if (typeof dadosSeguros[campo] === 'string') {
      dadosSeguros[campo] = dadosSeguros[campo].trim();
    }
  });

  if (parcial && Object.keys(dadosSeguros).length === 0) {
    throw new Error('Nenhum campo valido para atualizar');
  }

  return dadosSeguros;
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
  const dadosSeguros = prepararDados(tabela, dados);

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

async function remover(tabela, id) {
  validarTabela(tabela);
  validarId(id);

  const { error } = await supabase
    .from(tabela)
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  return { id };
}

async function atualizar(tabela, id, dados) {
  validarTabela(tabela);
  validarId(id);
  const dadosSeguros = prepararDados(tabela, dados, { parcial: true });

  const { data, error } = await supabase
    .from(tabela)
    .update(dadosSeguros)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export default {
  listar,
  criar,
  atualizar
};

