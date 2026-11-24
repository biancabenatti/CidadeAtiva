const { classificarIntencao } = require('./chatbotNlp');

function estadoInicial() {
  return {
    etapa: 'inicio',
    dados: {
      titulo: '',
      localizacao: '',
      descricao: '',
      desejaFoto: null,
    },
  };
}

function limparTexto(texto) {
  return String(texto || '').trim();
}

function resumoDados(dados) {
  const partes = [
    `Título: ${dados.titulo || '—'}`,
    `Localização: ${dados.localizacao || '—'}`,
    `Descrição: ${dados.descricao || '—'}`,
    `Foto: ${dados.desejaFoto ? 'pretende anexar no formulário' : 'sem foto'}`,
  ];
  return partes.join(' | ');
}

function respostaBase(intencao, confianca, resposta, estado, extras = {}) {
  return {
    intencao,
    confianca,
    resposta,
    estado,
    ...extras,
  };
}

function ehTextoInformativo(texto) {
  const t = limparTexto(texto);
  return t.length >= 3;
}

function processarMensagem(mensagem, estadoEntrada) {
  const texto = limparTexto(mensagem);
  const estado = estadoEntrada && estadoEntrada.etapa
    ? {
        etapa: estadoEntrada.etapa,
        dados: {
          titulo: estadoEntrada.dados?.titulo || '',
          localizacao: estadoEntrada.dados?.localizacao || '',
          descricao: estadoEntrada.dados?.descricao || '',
          desejaFoto: estadoEntrada.dados?.desejaFoto ?? null,
        },
      }
    : estadoInicial();

  const classificacao = classificarIntencao(texto);
  const { intencao, confianca } = classificacao;
  const confiancaMinima = 0.12;

  function mensagemForaDeEscopo() {
    switch (estado.etapa) {
      case 'coletando_titulo':
        return 'Sou um assistente focado no Cidade Ativa e não consigo responder perguntas fora desse contexto. Se quiser continuar, me informe o título/tipo do problema (ex.: "Buraco na rua").';
      case 'coletando_localizacao':
        return 'Posso ajudar apenas com o registro e consulta de ocorrências urbanas. Para continuar, informe a localização/endereço do problema.';
      case 'coletando_descricao':
        return 'Não consigo responder a esse assunto. Para continuar o registro, descreva o problema com mais detalhes.';
      case 'perguntando_foto':
        return 'Consigo ajudar só com ocorrências do Cidade Ativa. Você deseja anexar uma foto no formulário? Responda "sim" ou "sem foto".';
      case 'confirmacao_final':
        return 'Posso ajudar apenas com o registro de ocorrências. Deseja que eu preencha o formulário com os dados informados? Responda "sim", "corrigir" ou "não".';
      default:
        return 'Sou um assistente do Cidade Ativa e consigo ajudar com: registrar um problema urbano (título, localização e descrição) e orientar sobre a consulta de ocorrências. Deseja registrar uma ocorrência?';
    }
  }

  // Intenções globais / fora de escopo
  if (intencao === 'listar_ocorrencias' && confianca >= confiancaMinima) {
    return respostaBase(intencao, confianca,
      'Você pode ver as ocorrências registradas na página "Ocorrências". Se quiser, posso continuar te ajudando com um novo registro aqui.',
      estado,
      { acao: { tipo: 'navegar', destino: 'ocorrencias.html' } }
    );
  }

  if (intencao === 'fora_do_escopo' && confianca >= confiancaMinima) {
    const proximoEstado = (estado.etapa === 'inicio')
      ? { ...estado, etapa: 'aguardando_confirmacao_registro' }
      : estado;
    return respostaBase(intencao, confianca, mensagemForaDeEscopo(), proximoEstado);
  }

  if (intencao === 'ajuda' && confianca >= confiancaMinima) {
    if (['coletando_titulo', 'coletando_localizacao', 'coletando_descricao', 'perguntando_foto', 'confirmacao_final'].includes(estado.etapa)) {
      return respostaBase(intencao, confianca, mensagemForaDeEscopo(), estado);
    }
    return respostaBase(intencao, confianca,
      'Sou o chatbot do Cidade Ativa. Posso ajudar você a registrar um problema urbano: vou pedir título, localização e descrição (foto é opcional), mostrar um resumo e preencher o formulário para você enviar. Deseja registrar uma ocorrência?',
      { ...estado, etapa: 'aguardando_confirmacao_registro' }
    );
  }

  if (intencao === 'saudacao' && confianca >= confiancaMinima) {
    if (estado.etapa === 'inicio') {
      return respostaBase(intencao, confianca,
        'Olá! Posso ajudar você a registrar um problema na cidade. Deseja registrar uma ocorrência agora?',
        { ...estado, etapa: 'aguardando_confirmacao_registro' }
      );
    }
    return respostaBase(intencao, confianca, 'Ol?! ' + mensagemForaDeEscopo(), estado);
  }

  if ((intencao === 'despedida' || intencao === 'agradecimento') && confianca >= confiancaMinima) {
    const msg = intencao === 'agradecimento'
      ? 'De nada! Se precisar registrar outro problema, estou por aqui.'
      : 'Até mais! Se precisar, posso ajudar a registrar uma ocorrência.';
    return respostaBase(intencao, confianca, msg, estado);
  }
  switch (estado.etapa) {
    case 'inicio':
    case 'aguardando_confirmacao_registro': {
      const tNorm = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      const afirmativo = ['sim', 'ok', 'certo', 'confirmo', 'quero', 'quero sim', 'pode ser', 'isso', 'claro', 'vamos', 'bora'].includes(tNorm)
        || /^(sim|ok|certo|confirmo|quero registrar|pode registrar)\b/.test(tNorm);
      const negativo = ['nao', 'não', 'cancelar', 'agora nao', 'nao quero'].includes(tNorm) || /^nao\b/.test(tNorm);

      if (intencao === 'iniciar_registro' || intencao === 'confirmar' || afirmativo) {
        const resposta = (intencao === 'iniciar_registro')
          ? 'Certo! Qual é o título ou tipo do problema? (ex.: "Buraco na rua", "Poste com luz apagada")'
          : 'Ótimo! Qual é o título ou tipo do problema?';
        return respostaBase(afirmativo && intencao !== 'iniciar_registro' ? 'confirmar' : intencao, confianca,
          resposta,
          { ...estado, etapa: 'coletando_titulo' }
        );
      }
      if (intencao === 'negar' || intencao === 'despedida' || negativo) {
        return respostaBase(intencao === 'despedida' ? 'despedida' : 'negar', confianca,
          'Sem problemas. Se quiser, posso te levar à lista de ocorrências ou ajudar em outro momento. Deseja ver as ocorrências registradas?',
          { ...estadoInicial(), etapa: 'inicio' }
        );
      }
      if (intencao === 'informar_problema' || (ehTextoInformativo(texto) && tNorm.split(/\s+/).length >= 2 && !texto.includes('?'))) {
        estado.dados.titulo = texto;
        return respostaBase(intencao === 'informar_problema' ? intencao : 'informar_problema', confianca,
          `Entendi o problema: "${texto}". Agora me informe a localização/endereço (ex.: "Rua das Flores, 123").`,
          { ...estado, etapa: 'coletando_localizacao' }
        );
      }
      if (intencao === 'fora_do_escopo' || (confianca < 0.2 && texto.includes('?'))) {
        return respostaBase(intencao, confianca, mensagemForaDeEscopo(), { ...estado, etapa: 'aguardando_confirmacao_registro' });
      }
      if (confianca < confiancaMinima) {
        return respostaBase(intencao, confianca,
          'Não entendi bem. Você deseja registrar um problema urbano? Responda "sim" para começar ou descreva o problema.',
          { ...estado, etapa: 'aguardando_confirmacao_registro' }
        );
      }
      return respostaBase(intencao, confianca,
        'Posso ajudar a registrar uma ocorrência. Deseja registrar um problema agora? (sim/não)',
        { ...estado, etapa: 'aguardando_confirmacao_registro' }
      );
    }
    case 'coletando_titulo': {
      if (intencao === 'negar' && confianca >= confiancaMinima) {
        return respostaBase(intencao, confianca, 'Registro cancelado. Se precisar, posso começar novamente.', estadoInicial());
      }
      if (intencao === 'fora_do_escopo' || (confianca < 0.2 && texto.includes('?'))) {
        return respostaBase(intencao, confianca, mensagemForaDeEscopo(), estado);
      }
      if (!ehTextoInformativo(texto)) {
        return respostaBase(intencao, confianca,
          'O título é obrigatório. Por favor, informe o tipo do problema (ex.: "Buraco na rua").',
          estado
        );
      }
      estado.dados.titulo = texto;
      return respostaBase(intencao, confianca,
        'Título registrado. Agora informe a localização/endereço do problema.',
        { ...estado, etapa: 'coletando_localizacao' }
      );
    }

    case 'coletando_localizacao': {
      if (intencao === 'corrigir' && confianca >= 0.2) {
        return respostaBase(intencao, confianca,
          'Vamos corrigir. Qual deve ser o título/tipo do problema?',
          { ...estado, etapa: 'coletando_titulo' }
        );
      }
      if (intencao === 'fora_do_escopo' || (confianca < 0.2 && texto.includes('?'))) {
        return respostaBase(intencao, confianca, mensagemForaDeEscopo(), estado);
      }
      if (!ehTextoInformativo(texto)) {
        return respostaBase(intencao, confianca,
          'A localização é obrigatória. Por favor, informe o endereço ou ponto de referência.',
          estado
        );
      }
      estado.dados.localizacao = texto;
      return respostaBase(intencao, confianca,
        'Localização registrada. Agora descreva o problema com mais detalhes.',
        { ...estado, etapa: 'coletando_descricao' }
      );
    }

    case 'coletando_descricao': {
      if (intencao === 'corrigir' && confianca >= 0.2) {
        return respostaBase(intencao, confianca,
          'Vamos corrigir. Informe novamente a localização/endereço.',
          { ...estado, etapa: 'coletando_localizacao' }
        );
      }
      if (intencao === 'fora_do_escopo' || (confianca < 0.2 && texto.includes('?'))) {
        return respostaBase(intencao, confianca, mensagemForaDeEscopo(), estado);
      }
      if (!ehTextoInformativo(texto)) {
        return respostaBase(intencao, confianca,
          'A descrição é obrigatória. Por favor, descreva o problema com mais detalhes.',
          estado
        );
      }
      estado.dados.descricao = texto;
      return respostaBase(intencao, confianca,
        'Descrição registrada. Você deseja anexar uma foto? (A foto é opcional e pode ser selecionada no campo do formulário.) Responda "sim" ou "sem foto".',
        { ...estado, etapa: 'perguntando_foto' }
      );
    }

    case 'perguntando_foto': {
      if (intencao === 'pular_foto' || intencao === 'negar' || /sem foto/i.test(texto)) {
        estado.dados.desejaFoto = false;
        return respostaBase(intencao, confianca,
          `Tudo certo. Confira o resumo: ${resumoDados(estado.dados)}. Posso preencher o formulário com esses dados para você enviar? (sim/não/corrigir)`,
          { ...estado, etapa: 'confirmacao_final' }
        );
      }
      if (intencao === 'confirmar' || /sim|anexar|com foto|tenho foto/i.test(texto)) {
        estado.dados.desejaFoto = true;
        return respostaBase(intencao, confianca,
          `Ok, você poderá anexar a foto no campo "Foto da ocorrência" do formulário. Resumo: ${resumoDados(estado.dados)}. Posso preencher o formulário com esses dados? (sim/não/corrigir)`,
          { ...estado, etapa: 'confirmacao_final' }
        );
      }
      return respostaBase(intencao, confianca,
        'Não entendi. Você deseja anexar uma foto? Responda "sim" (vou anexar no formulário) ou "sem foto".',
        estado
      );
    }

    case 'confirmacao_final': {
      const tNorm = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      const querConfirmar = intencao === 'confirmar' || ['sim', 'ok', 'certo', 'confirmo', 'pode'].includes(tNorm) || /^sim\b/.test(tNorm);
      const querCorrigir = intencao === 'corrigir' || tNorm === 'corrigir' || /^corrigir\b/.test(tNorm);
      const querCancelar = intencao === 'negar' || ['nao', 'cancelar'].includes(tNorm) || /^nao\b/.test(tNorm);

      if (querConfirmar) {
        return respostaBase('confirmar', confianca,
          'Perfeito! Preenchi o formulário com os dados informados. Revise, anexe a foto se desejar e clique em "Enviar ocorrência" para concluir o registro.',
          { ...estado, etapa: 'concluido' },
          {
            preencherFormulario: {
              titulo: estado.dados.titulo,
              localizacao: estado.dados.localizacao,
              descricao: estado.dados.descricao,
            }
          }
        );
      }
      if (querCorrigir) {
        return respostaBase('corrigir', confianca,
          'Vamos corrigir. Qual deve ser o título/tipo do problema?',
          { ...estado, etapa: 'coletando_titulo' }
        );
      }
      if (querCancelar) {
        return respostaBase('negar', confianca,
          'Registro não enviado. Se quiser, posso começar novamente ou você pode preencher o formulário manualmente.',
          estadoInicial()
        );
      }
      return respostaBase(intencao, confianca,
        'Deseja que eu preencha o formulário com esses dados? Responda "sim" para confirmar, "corrigir" para alterar ou "não" para cancelar.',
        estado
      );
    }
    case 'concluido':
    default: {
      if (intencao === 'iniciar_registro' || intencao === 'confirmar') {
        return respostaBase(intencao, confianca,
          'Vamos registrar uma nova ocorrência. Qual é o título ou tipo do problema?',
          { ...estadoInicial(), etapa: 'coletando_titulo' }
        );
      }
      return respostaBase(intencao, confianca,
        'Se quiser registrar outra ocorrência, me diga "quero registrar um problema". Também posso ajudar com dúvidas.',
        estado
      );
    }
  }
}

module.exports = {
  estadoInicial,
  processarMensagem,
};
