const request = require('supertest');
const express = require('express');
const uploadRouter = require('../routes/upload');
const { uploadToS3 } = require('../services/s3');

// Mock do serviço S3
jest.mock('../services/s3', () => ({
  uploadToS3: jest.fn(),
}));

const app = express();
app.use('/api/upload', uploadRouter);

describe('Testes da Rota de Upload (/api/upload)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deve retornar erro 400 se nenhum arquivo for enviado', async () => {
    const response = await request(app)
      .post('/api/upload');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('erro', 'Envie um arquivo no campo "arquivo" (multipart/form-data).');
  });

  test('deve realizar o upload com sucesso (POST 201)', async () => {
    uploadToS3.mockResolvedValue({
      url: 'data:image/png;base64,abc',
      key: 'local-123.png',
      mime: 'image/png',
      base64: 'abc'
    });

    const response = await request(app)
      .post('/api/upload')
      .field('prefix', 'custom-prefix')
      .attach('arquivo', Buffer.from('fake-image-content'), 'teste.png');

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('url');
    expect(uploadToS3).toHaveBeenCalled();
  });

  test('deve aceitar arquivo .webp mesmo se o mimetype vier diferente', async () => {
    uploadToS3.mockResolvedValue({
      url: 'data:image/webp;base64,abc',
      key: 'local-123.webp',
      mime: 'image/webp',
      base64: 'abc'
    });

    const response = await request(app)
      .post('/api/upload')
      .attach('arquivo', Buffer.from('fake-webp'), {
        filename: 'foto.webp',
        contentType: 'application/octet-stream' // Forçando mimetype diferente para testar o fileFilter/fallback
      });

    expect(response.status).toBe(201);
  });

  test('deve rejeitar arquivos que não sejam imagens ou webp', async () => {
    const response = await request(app)
      .post('/api/upload')
      .attach('arquivo', Buffer.from('fake-txt'), 'documento.txt');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('erro', 'Apenas arquivos de imagem sao permitidos.');
  });

  test('deve retornar erro 500 se o uploadToS3 falhar internamente', async () => {
    uploadToS3.mockRejectedValue(new Error('Erro no S3'));

    const response = await request(app)
      .post('/api/upload')
      .attach('arquivo', Buffer.from('fake-image'), 'teste.png');

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('erro', 'Erro no S3');
  });

});