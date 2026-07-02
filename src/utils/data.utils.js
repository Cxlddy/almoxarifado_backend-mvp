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

export {
  numeroPositivo,
  pick,
  uuidValido
};
