/**
 * @jest-environment jsdom
 */

// Importa a função diretamente do arquivo real do front
// (Ajuste o caminho relativo se a pasta tests estiver dentro de front ou na raiz)
const { resolveApiBaseUrl } = require('../js/config.js');

describe('Testes do arquivo config.js', () => {

  beforeEach(() => {
    window.history.pushState({}, 'Test page', '/');
  });

  test('deve retornar a URL do parâmetro da query string removendo a barra final', () => {
    window.history.pushState({}, 'Test page', '/?api=https://meu-backend-customizado.com/');
    
    const resultado = resolveApiBaseUrl();
    expect(resultado).toBe('https://meu-backend-customizado.com');
  });

  test('deve retornar a URL de fallback quando não houver parâmetro api na query string', () => {
    window.history.pushState({}, 'Test page', '/?outroparametro=123');
    
    const resultado = resolveApiBaseUrl();
    expect(resultado).toBe('https://back-cidadeativa.onrender.com');
  });

  test('deve retornar a URL de fallback quando a query string estiver vazia', () => {
    window.history.pushState({}, 'Test page', '/');
    
    const resultado = resolveApiBaseUrl();
    expect(resultado).toBe('https://back-cidadeativa.onrender.com');
  });
});