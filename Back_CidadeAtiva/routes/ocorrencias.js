/**
 * @swagger
 * components:
 *   schemas:
 *     Ocorrencia:
 *       type: object
 *       required:
 *         - titulo
 *         - localizacao
 *         - descricao
 *       properties:
 *         id:
 *           type: string
 *           description: ID da ocorrência
 *         titulo:
 *           type: string
 *           description: Título da ocorrência
 *         localizacao:
 *           type: string
 *           description: Localização da ocorrência
 *         descricao:
 *           type: string
 *           description: Descrição da ocorrência
 *         imagem:
 *           type: string
 *           description: URL ou base64 da imagem
 *         criadoEm:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 */

/**
 * @swagger
 * /api/ocorrencias:
 *   post:
 *     summary: Criar uma nova ocorrência
 *     tags: [Ocorrencias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ocorrencia'
 *     responses:
 *       201:
 *         description: Ocorrência criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ocorrencia'
 */

/**
 * @swagger
 * /api/ocorrencias:
 *   get:
 *     summary: Listar todas as ocorrências
 *     tags: [Ocorrencias]
 *     responses:
 *       200:
 *         description: Lista de ocorrências
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ocorrencia'
 */

/**
 * @swagger
 * /api/ocorrencias/{id}:
 *   put:
 *     summary: Atualizar uma ocorrência pelo ID
 *     tags: [Ocorrencias]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da ocorrência
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ocorrencia'
 *     responses:
 *       200:
 *         description: Ocorrência atualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ocorrencia'
 */

/**
 * @swagger
 * /api/ocorrencias/{id}:
 *   delete:
 *     summary: Deletar uma ocorrência pelo ID
 *     tags: [Ocorrencias]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da ocorrência
 *     responses:
 *       200:
 *         description: Ocorrência deletada
 */

const express = require('express');
const router = express.Router();
const Ocorrencia = require('../models/Ocorrencia');
const { imagemParaRespostaCliente } = require('../services/s3');

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
        if (!termo) continue;

        const sinonimos = MAPA_SINONIMOS[termo] || [];
        const variantes = [termo, ...sinonimos];

        for (const variante of variantes) {
            if (!variante) continue;
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

    const consultaEmFrase = consultaNormalizada.replace(/\s+/g, ' ');
    if (consultaEmFrase && textoOcorrencia.includes(consultaEmFrase)) {
        score += 5;
    }

    return score;
}

async function montarListaOcorrencias(ocorrencias) {
    return Promise.all(
        ocorrencias.map(async (item) => {
            const ocorrenciaObj = item.toObject ? item.toObject() : item;
            const raw = ocorrenciaObj.imagem || null;
            return {
                ...ocorrenciaObj,
                imagem: await imagemParaRespostaCliente(raw),
            };
        })
    );
}

// CRIAR (imagem: URL no Mongo sempre que enviada; Postgres replica quando disponivel)
router.post('/', async (req, res) => {
    try {
        const { imagem, ...dadosOcorrencia } = req.body;
        const doc = { ...dadosOcorrencia };
        if (imagem) {
            doc.imagem = imagem;
        }

        const ocorrencia = new Ocorrencia(doc);
        await ocorrencia.save();

        const criado = ocorrencia.toObject();
        criado.imagem = await imagemParaRespostaCliente(criado.imagem);
        res.status(201).json(criado);
    } catch (err) {
        res.status(400).json({ erro: err.message });
    }
});

// LISTAR TODAS
router.get('/', async (req, res) => {
    try {
        const ocorrencias = await Ocorrencia.find();
        const ocorrenciasComImagem = await montarListaOcorrencias(ocorrencias);
        res.json(ocorrenciasComImagem);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

router.get('/busca/semantica', async (req, res) => {
    try {
        const consulta = String(req.query.q || '').trim();

        if (!consulta) {
            return res.json([]);
        }

        const ocorrencias = await Ocorrencia.find();
        const resultados = ocorrencias
            .map((item) => {
                const ocorrenciaObj = item.toObject();
                return {
                    ...ocorrenciaObj,
                    score: calcularRelevancia(consulta, ocorrenciaObj),
                };
            })
            .filter((item) => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 20);

        const ocorrenciasComImagem = await Promise.all(
            resultados.map(async (item) => {
                const imagem = item.imagem || null;
                return {
                    ...item,
                    imagem: await imagemParaRespostaCliente(imagem),
                };
            })
        );

        return res.json(ocorrenciasComImagem);
    } catch (err) {
        return res.status(500).json({ erro: err.message });
    }
});

// BUSCAR POR ID
router.get('/:id', async (req, res) => {
    try {
        const ocorrencia = await Ocorrencia.findById(req.params.id);

        if (!ocorrencia) {
            return res.status(404).json({ erro: 'Ocorrencia nao encontrada' });
        }

        const resposta = ocorrencia.toObject();
        const raw = resposta.imagem || null;
        resposta.imagem = await imagemParaRespostaCliente(raw);

        return res.json(resposta);
    } catch (err) {
        return res.status(400).json({ erro: err.message });
    }
});

// ATUALIZAR (imagem: nova URL, omitir para manter, null ou "" para remover)
router.put('/:id', async (req, res) => {
    try {
        const { imagem, ...dadosOcorrencia } = req.body;
        const id = req.params.id;

        const mongoUpdate = { ...dadosOcorrencia };

        if (imagem === null || imagem === '') {
            mongoUpdate.$unset = { imagem: '' };
        } else if (imagem !== undefined) {
            mongoUpdate.imagem = imagem;
        }

        const ocorrencia = await Ocorrencia.findByIdAndUpdate(id, mongoUpdate, { new: true });

        if (!ocorrencia) {
            return res.status(404).json({ erro: 'Ocorrencia nao encontrada' });
        }

        const resposta = ocorrencia.toObject();
        const raw = resposta.imagem || null;
        resposta.imagem = await imagemParaRespostaCliente(raw);

        return res.json(resposta);
    } catch (err) {
        return res.status(400).json({ erro: err.message });
    }
});

// DELETAR
router.delete('/:id', async (req, res) => {
    try {
        await Ocorrencia.findByIdAndDelete(req.params.id);
        res.json({ mensagem: 'Ocorrência deletada' });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

module.exports = router;