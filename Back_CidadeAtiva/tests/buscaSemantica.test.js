const test = require('node:test');
const assert = require('node:assert/strict');
const { calcularRelevancia } = require('../services/buscaSemantica');

function buscarSemantica(consulta, ocorrencias) {
  return ocorrencias
    .map((ocorrencia) => ({
      ...ocorrencia,
      score: calcularRelevancia(consulta, ocorrencia),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ score, ...dados }) => ({ ...dados, score }));
}

test('deve encontrar ocorrências pela busca semântica em “luz apagada”', () => {
  const ocorrencias = [
    {
      titulo: 'Poste sem energia',
      localizacao: 'Rua das Flores, 150',
      descricao: 'Falta iluminação pública e o poste está apagado há dois dias.',
    },
    {
      titulo: 'Buraco na calçada',
      localizacao: 'Avenida Central',
      descricao: 'Furo na calçada com risco de acidente.',
    },
  ];

  const resultado = buscarSemantica('luz apagada', ocorrencias);

  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].titulo, 'Poste sem energia');
  assert.ok(resultado[0].score > 0);
});

test('deve considerar “buraco” e “afundamento” como termos equivalentes', () => {
  const ocorrencias = [
    {
      titulo: 'Vazamento de água',
      localizacao: 'Praça da Matriz',
      descricao: 'Afundamento na rua causando risco de acidente.',
    },
  ];

  const resultado = buscarSemantica('buraco', ocorrencias);

  assert.equal(resultado.length, 1);
  assert.ok(resultado[0].score > 0);
});

test('deve retornar vazio quando não houver correspondência semântica', () => {
  const ocorrencias = [
    {
      titulo: 'Alagamento',
      localizacao: 'Rua do Porto',
      descricao: 'Água acumulada após chuva intensa.',
    },
  ];

  const resultado = buscarSemantica('problema de luz', ocorrencias);

  assert.deepEqual(resultado, []);
});
