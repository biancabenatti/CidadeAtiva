# Atividade prática — Árvore de decisão do ChatBot

## Funcionalidade escolhida

**Apoio ao cadastro de uma ocorrência urbana.** O ChatBot ficará na tela de registro e conduzirá a pessoa pelas informações que o Cidade Ativa já solicita: título, localização e descrição. A foto será opcional.

## Por que essa funcionalidade?

O cadastro é o fluxo principal do projeto: moradores informam problemas urbanos, como buracos e iluminação com defeito, para que sejam registrados. Um ChatBot pode orientar o preenchimento, verificar se os campos obrigatórios foram informados e confirmar os dados antes do envio. O registro existente envia esses dados para a API; a imagem é enviada separadamente e, se o upload não funcionar, o cadastro pode continuar sem ela.

## Árvore de decisão

```mermaid
flowchart TD
    A([Início: pessoa abre o ChatBot]) --> B{Quer registrar um problema urbano?}
    B -- Não --> C[Oferecer acesso à lista de ocorrências]
    C --> Z([Fim])
    B -- Sim --> D[Solicitar título ou tipo do problema]
    D --> E{Título informado?}
    E -- Não --> D1[Explicar que o título é obrigatório e pedir novamente]
    D1 --> D
    E -- Sim --> F[Solicitar endereço ou localização]
    F --> G{Localização informada?}
    G -- Não --> F1[Explicar que a localização é obrigatória e pedir novamente]
    F1 --> F
    G -- Sim --> H[Solicitar descrição do problema]
    H --> I{Descrição informada?}
    I -- Não --> H1[Explicar que a descrição é obrigatória e pedir novamente]
    H1 --> H
    I -- Sim --> J{Deseja anexar uma foto?}
    J -- Não --> M[Mostrar resumo sem foto]
    J -- Sim --> K[Solicitar arquivo de imagem]
    K --> L{Arquivo aceito e upload concluído?}
    L -- Não --> L1[Informar que a foto não foi anexada e oferecer continuar sem foto]
    L1 --> L2{Continuar sem foto?}
    L2 -- Não --> K
    L2 -- Sim --> M
    L -- Sim --> N[Mostrar resumo com foto]
    M --> O{Confirma o registro?}
    N --> O
    O -- Não --> P{Quer corrigir os dados ou cancelar?}
    P -- Corrigir --> D
    P -- Cancelar --> Z
    O -- Sim --> Q[Enviar ocorrência para a API]
    Q --> R{Cadastro realizado?}
    R -- Sim --> S[Confirmar o registro e oferecer acesso à lista]
    S --> Z
    R -- Não --> T[Informar que não foi possível registrar]
    T --> U{Tentar novamente?}
    U -- Sim --> Q
    U -- Não --> V[Orientar a pessoa a tentar novamente depois ou usar o formulário]
    V --> Z
```

## Regras e respostas esperadas

| Decisão | Comportamento do ChatBot |
|---|---|
| Pessoa não quer registrar | Encaminha para a lista de ocorrências já cadastradas. |
| Título, localização ou descrição vazios | Explica qual informação falta e pergunta novamente; não envia o cadastro incompleto. |
| Pessoa não tem foto | Continua normalmente; a foto não é obrigatória. |
| Upload da foto falha | Informa o problema e permite continuar sem foto ou tentar anexar novamente. |
| Pessoa não confirma o resumo | Permite corrigir as informações ou cancelar sem enviar. |
| Cadastro concluído | Confirma o sucesso e oferece acesso à lista de ocorrências. |
| API indisponível ou cadastro com erro | Informa que o envio falhou e oferece nova tentativa ou o formulário da página. |

## Exemplo de conversa

**ChatBot:** Olá! Posso ajudar você a registrar um problema na cidade. O que aconteceu?  
**Pessoa:** Tem um buraco na rua.  
**ChatBot:** Em qual rua ou endereço fica o problema?  
**Pessoa:** Rua das Flores, 123.  
**ChatBot:** Descreva o problema com um pouco mais de detalhe.  
**Pessoa:** O buraco é grande e está perto da faixa de pedestres.  
**ChatBot:** Você quer anexar uma foto?  
**Pessoa:** Não.  
**ChatBot:** Confira os dados: *Buraco na rua* — *Rua das Flores, 123* — *buraco grande perto da faixa de pedestres* — *sem foto*. Posso registrar?  
**Pessoa:** Sim.  
**ChatBot:** Ocorrência registrada! Obrigado por ajudar a melhorar a cidade.

## Limites da proposta

O ChatBot não promete prazo de atendimento nem informa o andamento de uma ocorrência, pois o projeto atualmente registra e lista ocorrências, mas não apresenta um fluxo de status ou acompanhamento. Seu papel nesta proposta é orientar e concluir o cadastro.
