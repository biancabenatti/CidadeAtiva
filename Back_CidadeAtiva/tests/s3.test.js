const { imagemParaRespostaCliente, uploadToS3 } = require('../services/s3'); // Ajuste o require para o caminho correto

describe('Testes do arquivo de imagens e S3', () => {
  
  describe('imagemParaRespostaCliente', () => {
    test('deve retornar null se o valor bruto for falso/vazio', () => {
      expect(imagemParaRespostaCliente(null)).toBeNull();
      expect(imagemParaRespostaCliente(undefined)).toBeNull();
      expect(imagemParaRespostaCliente('')).toBeNull();
    });

    test('deve retornar a string se o valor bruto já for uma string', () => {
      const urlTeste = 'https://exemplo.com/imagem.png';
      expect(imagemParaRespostaCliente(urlTeste)).toBe(urlTeste);
    });

    test('deve retornar o valor bruto caso não seja nem nulo nem string (ex: objeto ou outro tipo)', () => {
      const objetoTeste = { url: 'teste' };
      expect(imagemParaRespostaCliente(objetoTeste)).toEqual(objetoTeste);
    });
  });

  describe('uploadToS3', () => {
    test('deve processar o buffer e retornar a estrutura correta com parâmetros padrão', async () => {
      const bufferMock = Buffer.from('teste-buffer');
      const resultado = await uploadToS3({
        buffer: bufferMock,
      });

      expect(resultado).toHaveProperty('url');
      expect(resultado.url).toContain('data:image/png;base64,');
      expect(resultado).toHaveProperty('key');
      expect(resultado.key).toMatch(/^local-\d+\.png$/);
      expect(resultado.mime).toBe('image/png');
      expect(resultado.base64).toBe(bufferMock.toString('base64'));
    });

    test('deve respeitar contentType e originalName personalizados', async () => {
      const bufferMock = Buffer.from('outro-buffer');
      const resultado = await uploadToS3({
        buffer: bufferMock,
        contentType: 'image/jpeg',
        originalName: 'foto.jpg',
        prefix: 'custom-prefix'
      });

      expect(resultado.mime).toBe('image/jpeg');
      expect(resultado.url).toContain('data:image/jpeg;base64,');
      expect(resultado.key).toMatch(/^local-\d+\.jpg$/);
    });

    test('deve lidar com originalName vazio ou nulo usando extensão padrão', async () => {
      const bufferMock = Buffer.from('buffer-sem-nome');
      const resultado = await uploadToS3({
        buffer: bufferMock,
        contentType: 'image/png',
        originalName: null // testando branch do || ''
      });

      expect(resultado.key).toMatch(/^local-\d+\.png$/);
    });
  });

});