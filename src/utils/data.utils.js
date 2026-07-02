function pick(objeto, camposPermitidos) {
  return camposPermitidos.reduce((resultado, campo) => {
    if (Object.prototype.hasOwnProperty.call(objeto || {}, campo)) {
      resultado[campo] = objeto[campo];
    }

    return resultado;
  }, {});
}

function numeroPositivo(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0;
}

function uuidValido(valor) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(valor || '');
}

function normalizarTelefone(valor) {
  const apenasDigitos = String(valor || '').replace(/\D/g, '');

  if (!apenasDigitos) {
    return '';
  }

  if (apenasDigitos.length === 10 || apenasDigitos.length === 11) {
    return `55${apenasDigitos}`;
  }

  return apenasDigitos;
}

function telefoneValido(valor) {
  const telefone = normalizarTelefone(valor);
  return telefone.length >= 12 && telefone.length <= 15;
}

export {
  normalizarTelefone,
  numeroPositivo,
  pick,
  telefoneValido,
  uuidValido
};
