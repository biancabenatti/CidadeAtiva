const mongoose = require('mongoose');
const Ocorrencia = require('../models/Ocorrencia');

describe('Testes do Model Ocorrencia', () => {
  test('deve validar que campos obrigatórios são necessários', () => {
    const ocorrencia = new Ocorrencia({});
    const erro = ocorrencia.validateSync();
    
    expect(erro.errors.titulo).toBeDefined();
    expect(erro.errors.localizacao).toBeDefined();
    expect(erro.errors.descricao).toBeDefined();
  });

  test('deve criar uma ocorrência com sucesso quando os campos obrigatórios forem preenchidos', () => {
    const ocorrencia = new Ocorrencia({
      titulo: 'Buraco na via',
      localizacao: 'Rua Principal',
      descricao: 'Buraco grande perto do semáforo'
    });

    const erro = ocorrencia.validateSync();
    expect(erro).toBeUndefined();
    expect(ocorrencia.criadoEm).toBeDefined();
  });
});