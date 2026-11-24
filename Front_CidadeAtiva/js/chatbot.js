(function () {
  const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || window.location.origin;

  function apiUrl(path) {
    return `${API_BASE_URL.replace(/\/$/, '')}${path}`;
  }

  function criarElemento(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto != null) el.textContent = texto;
    return el;
  }

  function criarUI() {
    if (document.getElementById('chatbotPanel')) return;

    const fab = criarElemento('button', 'chatbot-fab');
    fab.id = 'chatbotFab';
    fab.type = 'button';
    fab.title = 'Abrir chatbot';
    fab.setAttribute('aria-label', 'Abrir chatbot');
    fab.textContent = '💬';

    const panel = criarElemento('div', 'chatbot-panel');
    panel.id = 'chatbotPanel';
    panel.innerHTML = `
      <div class="chatbot-header">
        <div>
          <h3>Assistente Cidade Ativa</h3>
          <small>Chatbot com TF-IDF + SVM (classificação de intenções)</small>
        </div>
        <button type="button" class="chatbot-fechar" id="chatbotFechar" aria-label="Fechar">×</button>
      </div>
      <div class="chatbot-mensagens" id="chatbotMensagens" aria-live="polite"></div>
      <form class="chatbot-form" id="chatbotForm">
        <input id="chatbotInput" type="text" placeholder="Digite ou fale sua mensagem..." autocomplete="off" />
        <button id="chatbotVoz" type="button" class="chatbot-voz" title="Falar mensagem" aria-label="Falar mensagem"><i class="fas fa-microphone" aria-hidden="true"></i></button>
        <button id="chatbotEnviar" type="submit">Enviar</button>
      </form>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    fab.addEventListener('click', () => {
      panel.classList.toggle('aberto');
      if (panel.classList.contains('aberto')) {
        const input = document.getElementById('chatbotInput');
        if (input) input.focus();
      }
    });

    document.getElementById('chatbotFechar').addEventListener('click', () => {
      panel.classList.remove('aberto');
    });
  }

  function adicionarMensagem(texto, autor, meta) {
    const lista = document.getElementById('chatbotMensagens');
    if (!lista) return;
    const msg = criarElemento('div', `chatbot-msg ${autor}`);
    msg.textContent = texto;
    if (meta) {
      const m = criarElemento('span', 'meta', meta);
      msg.appendChild(document.createElement('br'));
      msg.appendChild(m);
    }
    lista.appendChild(msg);
    lista.scrollTop = lista.scrollHeight;
  }

  function preencherFormulario(dados) {
    if (!dados) return;
    const map = {
      titulo: 'titulo',
      localizacao: 'localizacao',
      descricao: 'descricao',
    };
    Object.entries(map).forEach(([k, id]) => {
      const el = document.getElementById(id);
      if (el && typeof dados[k] === 'string') {
        el.value = dados[k];
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }

  async function enviarMensagem(texto, estadoAtual) {
    const res = await fetch(apiUrl('/api/chatbot/mensagem'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensagem: texto, estado: estadoAtual }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.erro || `Erro HTTP ${res.status}`);
    }
    return body;
  }

  async function init() {
    criarUI();

    let estado = null;
    try {
      const res = await fetch(apiUrl('/api/chatbot/estado-inicial'));
      if (res.ok) {
        const body = await res.json();
        estado = body.estado || null;
      }
    } catch (_) {
      estado = null;
    }

    adicionarMensagem(
      'Olá! Sou o assistente do Cidade Ativa. Posso ajudar você a registrar um problema urbano por aqui. Deseja registrar uma ocorrência?',
      'bot'
    );

    const form = document.getElementById('chatbotForm');
    const input = document.getElementById('chatbotInput');
    const botao = document.getElementById('chatbotEnviar');
    const botaoVoz = document.getElementById('chatbotVoz');
    if (!form || !input || !botao) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const texto = String(input.value || '').trim();
      if (!texto) return;

      adicionarMensagem(texto, 'user');
      input.value = '';
      botao.disabled = true;
      if (botaoVoz) botaoVoz.disabled = true;

      try {
        const resposta = await enviarMensagem(texto, estado);
        estado = resposta.estado || estado;

        let textoResposta = resposta.resposta || 'Não consegui gerar uma resposta.';
        if (resposta.acao && resposta.acao.tipo === 'navegar' && resposta.acao.destino) {
          textoResposta += `\nAcesse: ${resposta.acao.destino}`;
        }
        adicionarMensagem(textoResposta, 'bot');

        if (resposta.preencherFormulario) {
          preencherFormulario(resposta.preencherFormulario);
          adicionarMensagem('Campos do formulário preenchidos. Confira os dados e envie quando estiver pronto.', 'bot');
        }
      } catch (err) {
        adicionarMensagem('Não foi possível falar com o chatbot agora. Verifique se o backend está em execução e tente novamente.', 'bot');
      } finally {
        botao.disabled = false;
        if (botaoVoz && botaoVoz.dataset.suportado !== 'false') botaoVoz.disabled = false;
        input.focus();
      }
    });

    if (botaoVoz) {
      const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionCtor) {
        botaoVoz.dataset.suportado = 'true';
        const recognition = new SpeechRecognitionCtor();
        recognition.lang = 'pt-BR';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          botaoVoz.classList.add('ouvindo');
          botaoVoz.title = 'Ouvindo...';
        };

        const finalizarEscuta = () => {
          botaoVoz.classList.remove('ouvindo');
          botaoVoz.title = 'Falar mensagem';
        };

        recognition.onresult = (event) => {
          finalizarEscuta();
          const texto = event.results?.[0]?.[0]?.transcript?.trim();
          if (!texto) return;
          input.value = texto;
          if (typeof form.requestSubmit === 'function') {
            form.requestSubmit();
          } else {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
        };

        recognition.onerror = () => {
          finalizarEscuta();
          adicionarMensagem('Não foi possível reconhecer a voz. Tente novamente ou digite sua mensagem.', 'bot');
        };

        recognition.onend = finalizarEscuta;

        botaoVoz.addEventListener('click', () => {
          if (botao.disabled) return;
          try {
            recognition.start();
          } catch (_) {
            finalizarEscuta();
          }
        });
      } else {
        botaoVoz.dataset.suportado = 'false';
        botaoVoz.disabled = true;
        botaoVoz.title = 'Reconhecimento de voz indisponível neste navegador';
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
