/**
 * @jest-environment jsdom
 */

// Mock completo do SweetAlert
global.Swal = {
  fire: jest.fn().mockResolvedValue({ isConfirmed: true }),
  showLoading: jest.fn()
};

document.body.innerHTML = `
  <form id="formOcorrencia">
    <input id="titulo" value="" />
    <input id="localizacao" value="" />
    <textarea id="descricao"></textarea>
    <input type="file" id="foto" />
    <button type="submit">Enviar</button>
  </form>
`;

window.APP_CONFIG = { API_BASE_URL: 'https://back-cidadeativa.onrender.com/' };

const { 
  apiUrl, 
  arquivoEhImagemPermitida, 
  mensagemErroRede 
} = require('../js/registrar.js');

describe('Testes avançados de cobertura para registrar.js', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('apiUrl e validação de extensões de imagem', () => {
    expect(apiUrl('/api/upload')).toBe('https://back-cidadeativa.onrender.com/api/upload');
    expect(arquivoEhImagemPermitida({ type: 'image/png', name: 'foto.png' })).toBe(true);
    expect(arquivoEhImagemPermitida({ type: 'image/webp', name: 'imagem.webp' })).toBe(true);
    expect(arquivoEhImagemPermitida({ type: 'application/pdf', name: 'doc.pdf' })).toBe(false);
    expect(arquivoEhImagemPermitida(null)).toBe(true);
  });

  test('mensagemErroRede deve formatar erro de conexão corretamente', () => {
    const erro = new TypeError('Failed to fetch');
    const msg = mensagemErroRede(erro);
    expect(msg).toContain('Não foi possível conectar à API');
  });

  test('deve barrar submissão se campos obrigatórios estiverem vazios', async () => {
    const form = document.getElementById('formOcorrencia');
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    expect(global.Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: 'Campos obrigatórios!' }));
  });

  test('deve barrar submissão se o arquivo enviado não for uma imagem permitida', async () => {
    document.getElementById('titulo').value = 'Buraco';
    document.getElementById('localizacao').value = 'Rua A';
    document.getElementById('descricao').value = 'Descrição aqui';
    
    // Simula arquivo inválido
    const fileInput = document.getElementById('foto');
    Object.defineProperty(fileInput, 'files', {
      value: [{ type: 'text/plain', name: 'malicioso.txt' }],
      configurable: true
    });

    const form = document.getElementById('formOcorrencia');
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));

    expect(global.Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: 'Arquivo não suportado' }));
  });

  test('deve registrar com sucesso (com upload de foto e requisição OK)', async () => {
    document.getElementById('titulo').value = 'Praça suja';
    document.getElementById('localizacao').value = 'Praça Central';
    document.getElementById('descricao').value = 'Lixo acumulado na praça.';

    const fileInput = document.getElementById('foto');
    Object.defineProperty(fileInput, 'files', {
      value: [{ type: 'image/png', name: 'praca.png' }],
      configurable: true
    });

    // Mock do fetch: primeiro para o /api/upload, segundo para /api/ocorrencias
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://s3.amazonaws.com/foto.png' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 10, titulo: 'Praça suja' })
      });

    const form = document.getElementById('formOcorrencia');
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));

    // Aguarda o fluxo assíncrono do async/await do submit
    await new Promise(process.nextTick);
    await new Promise(process.nextTick);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: 'Sucesso!' }));
  });

  test('deve tratar erro quando a API retorna falha ao registrar ocorrência', async () => {
    document.getElementById('titulo').value = 'Poste apagado';
    document.getElementById('localizacao').value = 'Rua B';
    document.getElementById('descricao').value = 'Sem luz.';

    // Sem arquivo de foto desta vez
    Object.defineProperty(document.getElementById('foto'), 'files', {
      value: [],
      configurable: true
    });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ erro: 'Dados inválidos no servidor' })
    });

    const form = document.getElementById('formOcorrencia');
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));

    await new Promise(process.nextTick);
    await new Promise(process.nextTick);

    expect(global.Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: 'Erro!' }));
  });

});