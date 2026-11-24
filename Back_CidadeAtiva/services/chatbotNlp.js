const INTENTS_DATA = [
  {
    intent: 'saudacao',
    examples: [
      'oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite',
      'e ai', 'ei', 'tudo bem', 'ola chatbot', 'oi bot', 'alguem ai'
    ]
  },
  {
    intent: 'despedida',
    examples: [
      'tchau', 'ate mais', 'até mais', 'ate logo', 'até logo',
      'obrigado tchau', 'encerrar', 'sair', 'falou', 'vou embora'
    ]
  },
  {
    intent: 'agradecimento',
    examples: [
      'obrigado', 'obrigada', 'valeu', 'muito obrigado', 'agradeco',
      'thanks', 'vlw', 'obrigado pela ajuda'
    ]
  },
  {
    intent: 'iniciar_registro',
    examples: [
      'quero registrar uma ocorrencia', 'quero registrar um problema',
      'registrar problema', 'reportar problema', 'quero fazer uma denuncia',
      'gostaria de registrar', 'abrir ocorrencia', 'quero reclamar de um problema',
      'tem um problema na cidade', 'quero informar um problema urbano',
      'cadastrar ocorrencia', 'quero cadastrar um problema', 'sim quero registrar'
    ]
  },
  {
    intent: 'informar_problema',
    examples: [
      'tem um buraco na rua', 'poste com luz apagada', 'falta iluminacao',
      'vazamento de agua', 'lixo acumulado na calcada', 'arvore caida',
      'semaforo quebrado', 'bueiro entupido', 'pavimento danificado',
      'buraco grande', 'lampada queimada no poste', 'esgoto a ceu aberto',
      'muito lixo na rua', 'calcada quebrada', 'fiacao solta'
    ]
  },
  {
    intent: 'informar_localizacao',
    examples: [
      'fica na rua das flores 123', 'na avenida brasil', 'no centro da cidade',
      'perto da praca', 'rua sao joao numero 10', 'bairro jardim',
      'em frente a escola', 'na esquina da rua principal',
      'localizacao rua das acacias 45', 'endereco avenida central 200',
      'acontece na rua xv de novembro', 'fica no bairro vila nova'
    ]
  },
  {
    intent: 'informar_descricao',
    examples: [
      'o buraco e grande e perigoso', 'esta assim ha varios dias',
      'o problema acontece toda noite', 'a situacao esta piorando',
      'tem risco de acidente', 'ja faz uma semana que esta quebrado',
      'descricao do problema e que esta vazando agua sem parar',
      'detalhe: a lampada fica piscando', 'esta causando transtorno aos moradores'
    ]
  },
  {
    intent: 'confirmar',
    examples: [
      'sim', 'confirmo', 'pode registrar', 'isso mesmo', 'correto',
      'esta certo', 'pode enviar', 'ok', 'certo', 'quero confirmar',
      'sim pode continuar', 'afirmativo'
    ]
  },
  {
    intent: 'negar',
    examples: [
      'nao', 'não', 'cancelar', 'quero cancelar', 'nao quero',
      'melhor nao', 'deixa pra la', 'desisto', 'nao registrar'
    ]
  },
  {
    intent: 'corrigir',
    examples: [
      'quero corrigir', 'esta errado', 'mudar informacao', 'alterar dados',
      'corrigir titulo', 'corrigir localizacao', 'corrigir descricao',
      'voltar e editar', 'quero mudar', 'informacao incorreta'
    ]
  },
  {
    intent: 'pular_foto',
    examples: [
      'nao tenho foto', 'não tenho foto', 'sem foto', 'continuar sem foto',
      'pular foto', 'nao quero anexar', 'não quero anexar imagem',
      'seguir sem imagem', 'nao vou enviar foto'
    ]
  },
  {
    intent: 'listar_ocorrencias',
    examples: [
      'quero ver ocorrencias', 'listar ocorrencias', 'ver problemas registrados',
      'mostrar lista', 'consultar ocorrencias', 'onde vejo as ocorrencias',
      'quero acompanhar registros', 'ver registros da cidade'
    ]
  },
  {
    intent: 'ajuda',
    examples: [
      'ajuda', 'como funciona', 'o que voce faz', 'o que você faz',
      'como registrar', 'preciso de ajuda', 'me ajuda', 'quais opcoes',
      'como usar o chatbot', 'instrucoes', 'não sei o que fazer'
    ]
  },
  {
    intent: 'fora_do_escopo',
    examples: [
      'qual a capital da frança', 'qual é a capital do brasil', 'quem descobriu o brasil',
      'quanto é 2 mais 2', 'me conte uma piada', 'conte uma história',
      'qual o sentido da vida', 'você é humano', 'quem criou você',
      'qual a previsão do tempo', 'vai chover hoje', 'que horas são',
      'fale sobre política', 'quem vai ganhar o jogo', 'me recomenda um filme',
      'o que é inteligência artificial', 'explique machine learning', 'como fazer um bolo',
      'qual seu nome', 'você conhece o chatgpt', 'me ajude com minha lição de matemática',
      'qual a melhor linguagem de programação', 'conte uma curiosidade',
      'onde fica paris', 'quanto custa um carro', 'me dê uma receita',
      'qual é a cor do céu', 'quem é o presidente', 'fale de futebol',
      'pergunta aleatória', 'isso não tem nada a ver', 'assunto nada a ver',
      'você sabe cozinhar', 'me fale sobre ciência', 'resuma a segunda guerra mundial'
    ]
  }
];

const STOPWORDS = new Set([
  'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas', 'de', 'da', 'do', 'das', 'dos',
  'e', 'em', 'no', 'na', 'nos', 'nas', 'para', 'por', 'com', 'que', 'se', 'eu',
  'voce', 'você', 'meu', 'minha', 'isso', 'isto', 'ai', 'aí', 'la', 'lá', 'ao', 'à'
]);

function normalizarTexto(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizar(texto) {
  const normalizado = normalizarTexto(texto);
  if (!normalizado) return [];
  return normalizado
    .split(' ')
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

class TfidfVectorizer {
  constructor() {
    this.vocab = new Map();
    this.idf = [];
  }

  fit(documentosTokens) {
    const df = new Map();
    documentosTokens.forEach((tokens) => {
      const unicos = new Set(tokens);
      unicos.forEach((t) => df.set(t, (df.get(t) || 0) + 1));
    });

    const termos = Array.from(df.keys()).sort();
    termos.forEach((t, i) => this.vocab.set(t, i));

    const N = documentosTokens.length;
    this.idf = termos.map((t) => Math.log((1 + N) / (1 + (df.get(t) || 0))) + 1);
  }

  transform(tokens) {
    const counts = new Map();
    tokens.forEach((t) => {
      if (this.vocab.has(t)) {
        counts.set(t, (counts.get(t) || 0) + 1);
      }
    });

    const vec = {};
    const total = tokens.length || 1;
    for (const [t, c] of counts.entries()) {
      const idx = this.vocab.get(t);
      const tf = c / total;
      vec[idx] = tf * this.idf[idx];
    }
    return this.l2Normalizar(vec);
  }

  l2Normalizar(vec) {
    let soma = 0;
    for (const v of Object.values(vec)) soma += v * v;
    const norm = Math.sqrt(soma) || 1;
    const out = {};
    for (const [k, v] of Object.entries(vec)) out[k] = v / norm;
    return out;
  }
}

function dotSparse(w, x) {
  let s = 0;
  for (const [k, v] of Object.entries(x)) {
    s += (w[Number(k)] || 0) * v;
  }
  return s;
}

function scaleVector(w, fator) {
  for (let i = 0; i < w.length; i++) w[i] *= fator;
}

function addSparse(w, x, escala) {
  for (const [k, v] of Object.entries(x)) {
    const idx = Number(k);
    w[idx] = (w[idx] || 0) + escala * v;
  }
}

class LinearSVM {
  constructor({ epochs = 40, C = 1.0, lr = 0.05, reg = 0.01 } = {}) {
    this.epochs = epochs;
    this.C = C;
    this.lr = lr;
    this.reg = reg;
    this.w = [];
    this.b = 0;
  }

  fit(X, y) {
    const nFeatures = X.length ? Math.max(0, ...X.flatMap((x) => Object.keys(x).map(Number))) + 1 : 0;
    const dim = Math.max(nFeatures, 1);
    this.w = new Array(dim).fill(0);
    this.b = 0;

    const indices = X.map((_, i) => i);
    for (let epoch = 0; epoch < this.epochs; epoch++) {
      // embaralhamento simples
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }

      const lrT = this.lr / (1 + 0.1 * epoch);
      for (const i of indices) {
        const xi = X[i];
        const yi = y[i];
        const score = dotSparse(this.w, xi) + this.b;
        const margin = yi * score;

        // regularização L2: w <- w - lr*reg*w
        for (let k = 0; k < this.w.length; k++) {
          this.w[k] -= lrT * this.reg * this.w[k];
        }

        // perda hinge: se violou margem, atualiza na direção de y*x
        if (margin < 1) {
          addSparse(this.w, xi, lrT * this.C * yi);
          this.b += lrT * this.C * yi;
        }
      }
    }
  }

  decisionFunction(x) {
    return dotSparse(this.w, x) + this.b;
  }
}

class OvRSVMClassifier {
  constructor() {
    this.labels = [];
    this.models = new Map();
  }

  fit(X, labels) {
    this.labels = Array.from(new Set(labels));
    this.labels.forEach((label) => {
      const y = labels.map((l) => (l === label ? 1 : -1));
      const model = new LinearSVM({ epochs: 60, C: 1.0, lr: 0.08, reg: 0.01 });
      model.fit(X, y);
      this.models.set(label, model);
    });
  }

  predictScores(x) {
    const scores = {};
    for (const label of this.labels) {
      scores[label] = this.models.get(label).decisionFunction(x);
    }
    return scores;
  }

  predict(x) {
    const scores = this.predictScores(x);
    let melhor = null;
    let melhorScore = -Infinity;
    for (const [label, score] of Object.entries(scores)) {
      if (score > melhorScore) {
        melhorScore = score;
        melhor = label;
      }
    }
    return { intent: melhor, score: melhorScore, scores };
  }
}

function softmaxFromScores(scoresObj) {
  const entries = Object.entries(scoresObj);
  if (!entries.length) return {};
  const max = Math.max(...entries.map(([, v]) => v));
  const exps = entries.map(([k, v]) => [k, Math.exp(v - max)]);
  const sum = exps.reduce((acc, [, v]) => acc + v, 0) || 1;
  const probs = {};
  exps.forEach(([k, v]) => { probs[k] = v / sum; });
  return probs;
}

let modeloTreinado = null;

function treinarModelo() {
  const docsTokens = [];
  const labels = [];
  INTENTS_DATA.forEach(({ intent, examples }) => {
    examples.forEach((ex) => {
      docsTokens.push(tokenizar(ex));
      labels.push(intent);
    });
  });

  const vectorizer = new TfidfVectorizer();
  vectorizer.fit(docsTokens);
  const X = docsTokens.map((toks) => vectorizer.transform(toks));

  const classifier = new OvRSVMClassifier();
  classifier.fit(X, labels);

  modeloTreinado = { vectorizer, classifier };
  return modeloTreinado;
}

function garantirModelo() {
  if (!modeloTreinado) treinarModelo();
  return modeloTreinado;
}

function classificarIntencao(texto) {
  const { vectorizer, classifier } = garantirModelo();
  const tokens = tokenizar(texto);
  const vetor = vectorizer.transform(tokens);
  const resultado = classifier.predict(vetor);
  const probabilidades = softmaxFromScores(resultado.scores || {});
  const confianca = probabilidades[resultado.intent] || 0;
  return {
    texto: String(texto || ''),
    intencao: resultado.intent || 'ajuda',
    confianca,
    tokens,
  };
}

// treina ao carregar para respostas rápidas
treinarModelo();

module.exports = {
  INTENTS_DATA,
  normalizarTexto,
  tokenizar,
  TfidfVectorizer,
  LinearSVM,
  OvRSVMClassifier,
  treinarModelo,
  classificarIntencao,
};
