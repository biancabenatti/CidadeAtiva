const { calcularRelevancia } = require('../services/buscaSemantica');

describe('Testes de buscaSemantica', () => {
  const ocorrenciaExemplo = {
    titulo: 'Poste com luz apagada na rua principal',
    localizacao: 'Centro',
    descricao: 'Existe um buraco proximo e falta iluminacao'
  };

  test('deve encontrar ocorrências pela busca semântica em termos equivalentes', () => {
    const score = calcularRelevancia('luz', ocorrenciaExemplo);
    expect(score).toBeGreaterThan(0);
  });

  test('deve considerar termos exatos e frases completas somando score extra', () => {
    const score = calcularRelevancia('luz apagada', ocorrenciaExemplo);
    expect(score).toBeGreaterThan(5);
  });

  test('deve retornar zero quando não houver correspondência semântica', () => {
    const score = calcularRelevancia('hospital', ocorrenciaExemplo);
    expect(score).toBe(0);
  });

  // --- NOVOS TESTES PARA COBRIR OS BRANCHES FALTANTES ---

  test('deve retornar 0 se a consulta for vazia ou nula', () => {
    expect(calcularRelevancia('', ocorrenciaExemplo)).toBe(0);
    expect(calcularRelevancia(null, ocorrenciaExemplo)).toBe(0);
  });

  test('deve retornar 0 se a ocorrência for vazia, nula ou sem propriedades de texto', () => {
    expect(calcularRelevancia('luz', {})).toBe(0);
    expect(calcularRelevancia('luz', null)).toBe(0);
  });

  test('deve acionar a busca parcial para termos com mais de 4 letras', () => {
    // 'iluminacao' tem mais de 4 letras, testando uma variação cortada que ative o .slice(0, -1)
    const ocorrenciaParcial = { titulo: 'iluminacao', descricao: '' };
    const score = calcularRelevancia('iluminac', ocorrenciaParcial);
    expect(score).toBeGreaterThan(0);
  });
});