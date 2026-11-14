const request = require('supertest');
const express = require('express');
const ocorrenciasRouter = require('../routes/ocorrencias');
const Ocorrencia = require('../models/Ocorrencia');

// Mock do Model do Mongoose para simular o banco sem precisar do MongoDB real
jest.mock('../models/Ocorrencia');

const app = express();
app.use(express.json());
app.use('/api/ocorrencias', ocorrenciasRouter);

describe('Testes das Rotas de Ocorrências (/api/ocorrencias)', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- POST /api/ocorrencias ---
  test('deve criar uma nova ocorrência com sucesso (POST 201)', async () => {
    const mockSalvar = jest.fn().mockResolvedValue(true);
    const mockToObjetct = jest.fn().mockReturnValue({
      _id: '123',
      titulo: 'Buraco na rua',
      localizacao: 'Centro',
      descricao: 'Buraco grande',
      imagem: 'url-imagem.png'
    });

    Ocorrencia.mockImplementation(() => ({
      save: mockSalvar,
      toObject: mockToObjetct
    }));

    const response = await request(app)
      .post('/api/ocorrencias')
      .send({
        titulo: 'Buraco na rua',
        localizacao: 'Centro',
        descricao: 'Buraco grande',
        imagem: 'url-imagem.png'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('_id', '123');
  });

  test('deve retornar erro 400 ao falhar ao criar ocorrência', async () => {
    Ocorrencia.mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(new Error('Erro de validação'))
    }));

    const response = await request(app)
      .post('/api/ocorrencias')
      .send({ titulo: 'Incompleto' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('erro', 'Erro de validação');
  });

  // --- GET /api/ocorrencias ---
  test('deve listar todas as ocorrências (GET 200)', async () => {
    const mockOcorrencias = [
      {
        toObject: () => ({ _id: '1', titulo: 'Luz apagada', localizacao: 'Rua A', descricao: 'Sem luz' })
      }
    ];
    Ocorrencia.find.mockResolvedValue(mockOcorrencias);

    const response = await request(app).get('/api/ocorrencias');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
  });

  test('deve retornar erro 500 ao falhar ao listar ocorrências', async () => {
    Ocorrencia.find.mockRejectedValue(new Error('Erro no banco'));

    const response = await request(app).get('/api/ocorrencias');

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('erro', 'Erro no banco');
  });

  // --- GET /api/ocorrencias/busca/semantica ---
  test('deve retornar vazio se a busca semântica estiver vazia', async () => {
    const response = await request(app).get('/api/ocorrencias/busca/semantica?q=');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test('deve realizar a busca semântica com sucesso', async () => {
    const mockOcorrencias = [
      {
        toObject: () => ({ _id: '1', titulo: 'Poste com luz apagada', localizacao: 'Centro', descricao: 'Sem iluminação' })
      }
    ];
    Ocorrencia.find.mockResolvedValue(mockOcorrencias);

    const response = await request(app).get('/api/ocorrencias/busca/semantica?q=luz');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('deve retornar erro 500 na busca semântica se houver falha', async () => {
    Ocorrencia.find.mockRejectedValue(new Error('Falha semântica'));

    const response = await request(app).get('/api/ocorrencias/busca/semantica?q=luz');

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('erro', 'Falha semântica');
  });

  // --- GET /api/ocorrencias/:id ---
  test('deve buscar uma ocorrência por ID com sucesso (GET 200)', async () => {
    const mockOcorrencia = {
      toObject: () => ({ _id: '123', titulo: 'Teste ID' })
    };
    Ocorrencia.findById.mockResolvedValue(mockOcorrencia);

    const response = await request(app).get('/api/ocorrencias/123');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('_id', '123');
  });

  test('deve retornar 404 se a ocorrência não for encontrada por ID', async () => {
    Ocorrencia.findById.mockResolvedValue(null);

    const response = await request(app).get('/api/ocorrencias/999');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('erro', 'Ocorrencia nao encontrada');
  });

  test('deve retornar 400 ao falhar ao buscar por ID inválido', async () => {
    Ocorrencia.findById.mockRejectedValue(new Error('ID inválido'));

    const response = await request(app).get('/api/ocorrencias/abc');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('erro', 'ID inválido');
  });

  // --- PUT /api/ocorrencias/:id ---
  test('deve atualizar uma ocorrência com sucesso (PUT 200)', async () => {
    const mockOcorrenciaAtualizada = {
      toObject: () => ({ _id: '123', titulo: 'Atualizado' })
    };
    Ocorrencia.findByIdAndUpdate.mockResolvedValue(mockOcorrenciaAtualizada);

    const response = await request(app)
      .put('/api/ocorrencias/123')
      .send({ titulo: 'Atualizado', imagem: null });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('titulo', 'Atualizado');
  });

  test('deve retornar 404 ao tentar atualizar ocorrência inexistente', async () => {
    Ocorrencia.findByIdAndUpdate.mockResolvedValue(null);

    const response = await request(app)
      .put('/api/ocorrencias/999')
      .send({ titulo: 'Teste' });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('erro', 'Ocorrencia nao encontrada');
  });

  test('deve retornar 400 ao falhar na atualização', async () => {
    Ocorrencia.findByIdAndUpdate.mockRejectedValue(new Error('Erro de update'));

    const response = await request(app)
      .put('/api/ocorrencias/123')
      .send({ titulo: 'Teste' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('erro', 'Erro de update');
  });

  // --- DELETE /api/ocorrencias/:id ---
  test('deve deletar uma ocorrência com sucesso (DELETE 200)', async () => {
    Ocorrencia.findByIdAndDelete.mockResolvedValue(true);

    const response = await request(app).delete('/api/ocorrencias/123');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('mensagem', 'Ocorrência deletada');
  });

  test('deve retornar 500 se houver erro ao deletar', async () => {
    Ocorrencia.findByIdAndDelete.mockRejectedValue(new Error('Erro ao deletar'));

    const response = await request(app).delete('/api/ocorrencias/123');

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('erro', 'Erro ao deletar');
  });

});