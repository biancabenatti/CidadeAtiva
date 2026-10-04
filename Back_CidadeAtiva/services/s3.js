const path = require('path');

function imagemParaRespostaCliente(valorBruto) {
  if (!valorBruto) {
    return null;
  }

  if (typeof valorBruto === 'string') {
    return valorBruto;
  }

  return valorBruto;
}

async function uploadToS3({ buffer, contentType, originalName, prefix = 'ocorrencias' }) {
  const base64 = buffer.toString('base64');
  const mime = contentType || 'image/png';
  const extensao = path.extname(originalName || '') || '.png';

  const dataUrl = `data:${mime};base64,${base64}`;

  return {
    url: dataUrl,
    key: `local-${Date.now()}${extensao}`,
    mime,
    base64,
  };
}

module.exports = {
  uploadToS3,
  imagemParaRespostaCliente,
};
