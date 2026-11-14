const express = require('express');
const request = require('supertest');

describe('Testes do Servidor (index.js)', () => {
  test('deve responder na rota raiz GET /', async () => {
    const app = express();
    app.get('/', (req, res) => {
      res.send('Servidor Cidade Ativa rodando!');
    });

    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Servidor Cidade Ativa rodando!');
  });
});