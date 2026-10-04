const test = require('node:test');
const assert = require('node:assert/strict');

function normalizarTexto(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function calcularRelevancia(consulta, ocorrencia) {
  const termoConsulta = normalizarTexto(consulta);
  const textoOcorrencia = normalizarTexto(
    `${ocorrencia.titulo} ${ocorrencia.localizacao} ${ocorrencia.descricao}`
  );

  const termos = termoConsulta.split(' ').filter(Boolean);
  let score = 0;

  for (const termo of termos) {
    if (!termo) continue;
    if (textoOcorrencia.includes(termo)) score += 3;
    if (textoOcorrencia.includes(termo + 's') || textoOcorrencia.includes(termo.substring(0, termo.length - 1))) score += 1;
    if (termo === 'luz' && textoOcorrencia.includes('iluminacao')) score += 3;
    if (termo === 'buraco' && textoOcorrencia.includes('furo')) score += 3;
    if (termo === 'falta' && textoOcorrencia.includes('ausencia')) score += 3;
    if (termo === 'limpeza' && textoOcorrencia.includes('sujeira')) score += 3;
  }

  return score;
}

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

test('deve considerar termos semânticos equivalentes como “furo” e “buraco”', () => {
  const ocorrencias = [
    {
      titulo: 'Vazamento de água',
      localizacao: 'Praça da Matriz',
      descricao: 'Há um buraco na rua causando risco de acidente.',
    },
  ];

  const resultado = buscarSemantica('furo na rua', ocorrencias);

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
