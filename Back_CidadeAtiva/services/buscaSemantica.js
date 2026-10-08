const MAPA_SINONIMOS = {
    luz: ['luz', 'energia', 'iluminacao', 'ilumina', 'poste', 'apagada', 'apagado', 'lampada'],
    buraco: ['buraco', 'furo', 'afundamento', 'trinca', 'desnivel'],
    lixo: ['lixo', 'entulho', 'sujeira', 'residuo', 'residuos', 'descarte'],
    agua: ['agua', 'vazamento', 'encanamento', 'torneira', 'inundacao', 'alagamento'],
    rua: ['rua', 'avenida', 'logradouro', 'via', 'calçada', 'calcada', 'estrada'],
    seguranca: ['seguranca', 'risco', 'perigo', 'acidente', 'violencia'],
};

function normalizarTexto(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function calcularRelevancia(consulta, ocorrencia) {
    const consultaNormalizada = normalizarTexto(consulta);
    const textoOcorrencia = normalizarTexto(
        `${ocorrencia.titulo || ''} ${ocorrencia.localizacao || ''} ${ocorrencia.descricao || ''}`
    );

    if (!consultaNormalizada || !textoOcorrencia) return 0;

    const termosConsulta = consultaNormalizada.split(' ').filter(Boolean);
    let score = 0;

    for (const termo of termosConsulta) {
        const sinonimos = MAPA_SINONIMOS[termo] || [];
        const variantes = [termo, ...sinonimos];

        for (const variante of variantes) {
            if (textoOcorrencia.includes(variante)) {
                score += 4;
            }
        }

        if (textoOcorrencia.includes(termo)) {
            score += 2;
        }

        if (termo.length > 4 && textoOcorrencia.includes(termo.slice(0, -1))) {
            score += 1;
        }
    }

    if (textoOcorrencia.includes(consultaNormalizada)) {
        score += 5;
    }

    return score;
}

module.exports = { calcularRelevancia };
