const express = require('express');
const router = express.Router();
const { processarMensagem, estadoInicial } = require('../services/chatbotRegras');

router.get('/estado-inicial', (req, res) => {
  return res.json({ estado: estadoInicial() });
});

router.post('/mensagem', (req, res) => {
  try {
    const mensagem = String(req.body?.mensagem || '').trim();
    const estado = req.body?.estado || null;

    if (!mensagem) {
      return res.status(400).json({ erro: 'Mensagem é obrigatória.' });
    }

    const resultado = processarMensagem(mensagem, estado);
    return res.json(resultado);
  } catch (err) {
    return res.status(500).json({ erro: err.message || 'Erro ao processar mensagem.' });
  }
});

module.exports = router;
