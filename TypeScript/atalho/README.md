# Atalho: expansor de snippets para Chrome

Extensão para Chrome (Manifest V3 + TypeScript) que troca um **atalho** digitado (ex.: `/sig`) pelo
texto de um **snippet**. O snippet pode puxar dados da página aberta, a data de hoje e o que você
copiou, e tem fórmulas simples.

```text
Você digita:   /atd
Vira:          Olá! O protocolo do seu atendimento é 879988.
```

É um projeto pessoal de estudo, **inspirado** no Text Blaze e sem ligação com ele. Esta é a
**Fase 1**: expansão de texto, `{site}`, `{time}`, `{clipboard}`, fórmulas com `extractregex` e
`catch`, e um dashboard para gerenciar tudo.

## Sumário
- [Instalação](#instalação)
- [Primeiros passos](#primeiros-passos)
- [Referência dos comandos](#referência-dos-comandos)
  - [{site}: dados da página](#site-dados-da-página)
  - [{time}: data e hora](#time-data-e-hora)
  - [{clipboard}: o que você copiou](#clipboard-o-que-você-copiou)
  - [Fórmulas {=...}, variáveis, extractregex e catch](#fórmulas--variáveis-extractregex-e-catch)
  - [Chaves literais e escapes](#chaves-literais-e-escapes)
  - [Quando algo dá errado](#quando-algo-dá-errado)
- [Exemplo real: número do ticket no Zendesk](#exemplo-real-número-do-ticket-no-zendesk)
- [Dashboard: preview, backup e modo diagnóstico](#dashboard-preview-backup-e-modo-diagnóstico)
- [Onde funciona e limitações](#onde-funciona-e-limitações)
- [Permissões e privacidade](#permissões-e-privacidade)
- [Desenvolvimento](#desenvolvimento)
- [Próximas fases](#próximas-fases)

---

## Instalação

A extensão não está na Chrome Web Store. Você baixa a versão pronta que o GitHub Actions gera a
cada mudança e carrega no Chrome em **modo do desenvolvedor**. Não precisa instalar Node.

### 1. Baixar
1. No GitHub, abra a aba **Actions** do repositório e clique no workflow **"Atalho (extensão Chrome)"**.
2. Clique na execução mais recente com ✅ (da `main` ou da branch que você quer testar).
3. Role até **Artifacts** e clique em **`atalho-chrome-mv3`**. Vem um `.zip` (precisa estar logado;
   o arquivo fica disponível por 30 dias).
4. Extraia o `.zip` numa pasta **fixa**, por exemplo `Documentos\Atalho`. Dentro dela precisa
   estar o arquivo `manifest.json`.

### 2. Carregar no Chrome
1. Abra `chrome://extensions`.
2. Ligue o **Modo do desenvolvedor** (chave no canto superior direito).
3. Clique em **Carregar sem compactação** e escolha a pasta do passo anterior (a que tem o
   `manifest.json`).
4. Opcional: clique no ícone de quebra-cabeça da barra do Chrome e **fixe** o Atalho.
5. **Recarregue (F5) as abas que já estavam abertas.** A extensão só entra nas páginas carregadas
   depois dela.

Na primeira instalação, o Atalho já vem com dois exemplos: `/ola` e `/pag`. Abra o Gmail e digite
`/ola` para ver funcionando.

### Atualizar para uma versão nova
1. Baixe o novo `atalho-chrome-mv3` e **substitua os arquivos dentro da mesma pasta**.
2. Em `chrome://extensions`, clique no ↻ do card do Atalho.
3. Recarregue (F5) as abas abertas.

> ⚠️ **Use sempre a mesma pasta.** O Chrome identifica uma extensão "sem compactação" pelo
> caminho da pasta. Se você carregar de outra pasta, ela vira outra extensão e seus snippets não
> aparecem (eles continuam guardados na antiga). E **remover** a extensão apaga os snippets:
> [exporte um backup](#backup) antes.

---

## Primeiros passos

1. Clique no ícone do Atalho: o **dashboard** abre numa aba.
2. Clique em **+ Novo snippet** e preencha:
   - **Nome:** para você achar depois (ex.: `Assinatura`);
   - **Atalho:** o que você vai digitar (ex.: `/sig`);
   - **Conteúdo:** o texto, com comandos se quiser:
     ```text
     Att,
     Leo
     {time: DD/MM/YYYY}
     ```
3. Confira o **Preview** (ele mostra o resultado enquanto você digita) e clique em **Salvar** (ou Ctrl+S).
4. Em qualquer campo de texto (Gmail, WhatsApp Web, um formulário...), digite `/sig`. Ele vira o
   texto **assim que você digita o último caractere**, sem Espaço nem Enter.
5. Não gostou? **Ctrl+Z** desfaz e devolve o `/sig`.

### Regras do atalho
- De 2 a 50 caracteres, sem espaços. Maiúsculas e minúsculas contam (`/Sig` ≠ `/sig`).
- Não pode repetir: o dashboard bloqueia atalho duplicado.
- **Precisa estar separado do que vem antes.** O atalho expande no início do campo ou da linha, ou
  depois de espaço ou pontuação. Colado em letra, número, `_`, `/` ou `\`, ele não expande:

  | Você digita | Expande? |
  |---|---|
  | `/sig` no começo, `Olá /sig`, `(/sig` | sim |
  | `a/sig`, `2/sig` | não (colado em letra ou número) |
  | `site.com/sig...`, `https://sig...` | não (dentro de um endereço) |
- **Conflito de prefixo:** se existir `/s` e `/sig`, ao digitar `/sig` o `/s` dispara primeiro e
  `/sig` nunca acontece. O dashboard **avisa** (em amarelo) quando isso acontece (considerando a
  regra do separador: `si` não atrapalha `/sig`, porque em `/si` ele está colado na `/`).
- Dica: comece os atalhos com um símbolo (`/`, `;`, `!`) para não disparar sem querer em textos normais.

---

## Referência dos comandos

Comandos ficam entre chaves, com o nome **colado** na `{`: `{site: url}` é comando, mas `{ site: url}`
é texto normal (assim JSON e código colados num snippet não quebram). Os nomes diferenciam maiúsculas:
`{site: url}` funciona, `{site: URL}` dá erro.

Os exemplos abaixo usam esta página imaginária:
- **URL:** `https://loja.com/pedidos/98765?id=123&tab=x#detalhes`
- **Título da aba:** `Pedido 98765 — Loja`
- **HTML:**
  ```html
  <h1>Pedido 98765</h1>
  <div class="cliente"><span class="nome">Maria Silva</span></div>
  <ul class="itens"><li>Camiseta</li><li>Boné</li></ul>
  ```
- **Data e hora:** quinta-feira, 01/10/2026, 14:30.

### {site}: dados da página

Lê a página **onde você está digitando**.

| Snippet | Resultado |
|---|---|
| `{site: url}` | `https://loja.com/pedidos/98765?id=123&tab=x#detalhes` |
| `{site: domain}` | `loja.com` |
| `{site: path}` | `/pedidos/98765` |
| `{site: protocol}` | `https` |
| `{site: query}` | `?id=123&tab=x` |
| `{site: hash}` | `#detalhes` |
| `{site: title}` | `Pedido 98765 — Loja` |
| `{site: selection}` | o texto selecionado na página, sem espaços nas pontas (ver abaixo) |
| `{site: text}` | o texto da página inteira (use com `selector=`) |
| `{site: html}` | o HTML da página inteira (use com `selector=`) |

**`selector=`** escolhe um elemento com um seletor CSS (o mesmo do `document.querySelector`). Só vale
com `text` e `html`. **`multiple=yes`** pega todos os elementos e junta com `, `.

| Snippet | Resultado |
|---|---|
| `{site: text; selector=h1}` | `Pedido 98765` |
| `{site: text; selector=.cliente .nome}` | `Maria Silva` |
| `{site: html; selector=.nome}` | `<span class="nome">Maria Silva</span>` |
| `{site: text; selector=li; multiple=yes}` | `Camiseta, Boné` |
| `{site: text; selector=.vendedor}` | erro: nenhum elemento encontrado (use `catch`, veja abaixo) |

Detalhes:
- `text` devolve o texto visível do elemento, sem espaços nas pontas.
- `;` e `}` dentro de aspas, colchetes ou parênteses fazem parte do seletor:
  `selector=a[title="x;y"]`, `selector=input[name=email]` e `selector=li:nth-child(2)` funcionam.
- **Como achar o seletor:** na página, clique com o botão direito no elemento → **Inspecionar** →
  no código destacado, botão direito → **Copiar** → **Copiar seletor**. Depois teste no dashboard
  colando o HTML na "Página de teste" (veja [Dashboard](#dashboard-preview-backup-e-modo-diagnóstico)).
- **`selection`:** quando você clica num campo, o Chrome desfaz a seleção da página. Por isso o
  Atalho guarda **a última seleção feita fora de um campo**: selecione o texto, clique no campo e
  digite o atalho.

### {time}: data e hora

`{time: formato}` usa a data e hora do momento da expansão, em português. O formato é obrigatório.
Texto fixo vai entre **colchetes**.

| Snippet | Resultado |
|---|---|
| `{time: DD/MM/YYYY}` | `01/10/2026` |
| `{time: HH:mm}` | `14:30` |
| `{time: dddd, DD [de] MMMM [de] YYYY}` | `quinta-feira, 01 de outubro de 2026` |
| `{time: LL}` | `1 de outubro de 2026` |
| `{time: [Hoje é] dddd}` | `Hoje é quinta-feira` |

<details>
<summary>Tabela de códigos de formato</summary>

| Código | Exemplo | Código | Exemplo |
|---|---|---|---|
| `D` / `DD` | `1` / `01` | `H` / `HH` | `14` / `14` |
| `M` / `MM` | `10` / `10` | `hh` + `A` | `02` + `PM` |
| `MMM` / `MMMM` | `out` / `outubro` | `mm` | `30` |
| `YY` / `YYYY` | `26` / `2026` | `ss` | `05` |
| `ddd` / `dddd` | `qui` / `quinta-feira` | `LT` | `14:30` |
| `L` | `01/10/2026` | `LL` | `1 de outubro de 2026` |
| `LLL` | `1 de outubro de 2026 às 14:30` | `LLLL` | `quinta-feira, 1 de outubro de 2026 às 14:30` |

Os códigos são os do [dayjs](https://day.js.org/docs/en/display/format) (os mesmos do Text Blaze).
</details>

### {clipboard}: o que você copiou

`{clipboard}` insere o texto da área de transferência (o último Ctrl+C).

| Snippet | Resultado (se você copiou "texto copiado") |
|---|---|
| `Você copiou: {clipboard}` | `Você copiou: texto copiado` |

Se o site bloquear a leitura, a extensão tenta por outro caminho (um documento interno da
extensão). Se mesmo assim não der, aparece um erro no lugar.

### Fórmulas {=...}, variáveis, extractregex e catch

`{=...}` calcula um valor e insere no texto. Dentro da fórmula:

- **Texto** vai entre aspas **duplas**: `{="texto fixo"}` → `texto fixo`. Para uma aspa dentro do
  texto, use `\"`. Aspas simples não valem (o erro explica).
- **Comandos** podem entrar direto: `{site: query}`, `{time: YYYY}`, `{clipboard}`.
- **Variáveis:** `{nome=...}` guarda um valor **sem imprimir nada**; `{=nome}` imprime. A variável
  precisa ser definida antes de ser usada. O nome aceita acentos (`{preço=...}`).

#### `extractregex(texto, regex)`
Procura a [expressão regular](https://regexr.com/) no texto:
- se a regex tem um grupo entre parênteses, devolve o **1º grupo**;
- se não tem grupo, devolve o trecho inteiro que casou;
- se não achar nada, devolve **texto vazio** (não é erro);
- regex inválida é erro.

Não precisa dobrar as barras: `"\d+"` funciona como está.

| Snippet | Resultado |
|---|---|
| `{=extractregex({site: query}, "id=([^&]+)")}` | `123` (parâmetro `id` da URL) |
| `{=extractregex({site: path}, "/([^/]+)$")}` | `98765` (último pedaço do caminho) |
| `{pedido=extractregex({site: path}, "/([^/]+)$")}Pedido nº {=pedido}` | `Pedido nº 98765` |

#### `catch(expressão, padrão)`
Calcula a expressão; se ela **der erro**, usa o padrão.

| Snippet | Resultado |
|---|---|
| `{=catch({site: text; selector=.vendedor}, "Não encontrado")}` | `Não encontrado` |
| `{=catch({site: text; selector=h1}, "(sem título)")}` | `Pedido 98765` |

> O `catch` só age em **erro**. Como `extractregex` devolve texto vazio quando não acha nada (sem
> erro), `catch(extractregex(...), "padrão")` nunca usa o padrão. Escolher um padrão para "vazio"
> depende do `{if}`, que chega na Fase 2.

### Chaves literais e escapes

| Você escreve | Sai |
|---|---|
| `\{não é comando\}` | `{não é comando}` |
| `\\` | `\` |
| `{"a": 1}`, `{ }`, `if (x) { y }` | igual (chave sem nome colado não é comando) |
| `C:\Users\Leo` | igual (outras barras ficam como estão) |

Dentro de um argumento (formato do `{time}`, seletor), `\;` e `\}` viram `;` e `}`.

### Quando algo dá errado
Um erro **não estraga o snippet inteiro**: só o trecho com problema vira `[ERRO: ...]` e o resto
aparece normalmente. Exemplos:

```text
{site: text; selector=.vendedor}
→ [ERRO: {site}: nenhum elemento encontrado para o seletor ".vendedor" (use catch() para definir um texto padrão)]

{site: URL}
→ [ERRO: Valor inválido 'URL' em {site}. Use um destes: url, domain, path, protocol, query, hash, title, text, html, selection (diferencia maiúsculas de minúsculas)]
```

Na página, aparece também um aviso discreto no canto inferior direito. No dashboard, o preview
lista cada erro com **linha e coluna**.

---

## Exemplo real: número do ticket no Zendesk

Na URL `https://suaempresa.zendesk.com/agent/tickets/879988`, o número do ticket é o final do
caminho. Este snippet guarda o número numa variável e usa na saudação:

```text
{protocolo=extractregex({site: path}, "tickets/(\d+)")}Olá.
Espero que esteja bem.

Meu nome é Leo e faço parte do time de atendimento. Vou dar andamento no seu atendimento.

O protocolo do seu atendimento é {=protocolo}
```

Resultado: `... O protocolo do seu atendimento é 879988`.

> **Conflito com as macros do Zendesk:** no Zendesk, digitar `/` no campo de resposta abre o menu de
> macros. O Atalho expande mesmo assim (testado com o editor do Zendesk, o CKEditor 5), mas, se o
> menu atrapalhar, use outro prefixo nos atalhos (ex.: `;atd`) ou desligue os atalhos de teclado das
> macros no seu perfil do Zendesk.

---

## Dashboard: preview, backup e modo diagnóstico

- **Busca:** filtra por nome, atalho ou conteúdo (ignora acentos e maiúsculas).
- **Preview ao vivo:** mostra o resultado enquanto você edita, sem salvar.
- **Página de teste:** no painel "Página de teste", você define a URL, o título, a seleção, o
  clipboard e o **HTML** que o preview usa. Cole ali o HTML de uma página (Inspecionar → botão
  direito no `<html>` → Copiar → Copiar elemento) para testar um `selector=` antes de usar de verdade.
  Nada desse HTML é executado.
- **Cola rápida:** um resumo de todos os comandos, no fim da página.

### Backup
- **Exportar backup** baixa `atalho-backup-AAAA-MM-DD.json` com todos os snippets.
- **Importar backup** lê esse arquivo e mostra quantos snippets ele tem. Você escolhe:
  - **Mesclar** (padrão): mantém os seus e adiciona os do arquivo. Atalhos repetidos são pulados, e
    o relatório diz quais e por quê.
  - **Substituir tudo:** apaga os seus e usa só os do arquivo (pede confirmação).
- Os snippets ficam só neste computador. Para levar para outro, exporte e importe.

### Modo diagnóstico
Em **Configurações**, ligue o **Modo diagnóstico**. Na página onde algo não funciona, aperte F12 →
**Console**: cada passo da expansão aparece com o prefixo `[Atalho]` (campo detectado, texto antes do
cursor, atalho encontrado, método de inserção). Mande essas linhas junto com o relato do problema.

---

## Onde funciona e limitações

**Funciona em:**
- `input` de texto, e-mail, busca, URL e telefone; `textarea`;
- campos `contenteditable` (corpo do Gmail, por exemplo);
- inputs controlados por **React** (a mudança chega no estado do componente);
- editores ricos que controlam a própria digitação: **CKEditor 5** (Zendesk), ProseMirror, Lexical,
  Slate, Quill e Draft.js. Neles, o texto entra como uma "colagem", então o Ctrl+Z do editor funciona;
- iframes, inclusive editores dentro de iframes.

**Não funciona (ou funciona diferente):**
- **Campos de senha:** ignorados de propósito.
- **Páginas do Chrome** (`chrome://...`, Chrome Web Store, visualizador de PDF) e a **barra de
  endereço**: o Chrome não deixa extensões rodarem ali.
- **Google Docs/Sheets:** usam um editor próprio que não é um campo de texto comum (fora do escopo).
- **Iframes de outro domínio:** a expansão funciona, mas o `{site}` lê a página **do iframe**, não a
  página principal.
- **Shadow DOM fechado:** componentes que escondem os próprios campos não são alcançados.
- **Depois de atualizar a extensão**, as abas abertas precisam de F5.
- **Regex pesada sobre página gigante** (`extractregex({site: text}, ...)`) pode deixar a aba lenta. Prefira
  um `selector=` que pegue só o trecho que interessa.
- Só **texto simples**: negrito, links e imagens no snippet ficam para uma fase futura.
- Fora da Fase 1: `{if}`, `{repeat}`, formulários (`{formtext}`...), `{urlload}`, ler outra aba (`page=`).

---

## Permissões e privacidade

| Permissão | Para quê |
|---|---|
| Ler e alterar dados em todos os sites (content script) | Escutar a digitação em qualquer campo e trocar o atalho pelo texto |
| `storage` | Guardar os snippets no próprio Chrome (`chrome.storage.local`) |
| `clipboardRead` | O comando `{clipboard}` |
| `offscreen` | Plano B para ler o clipboard quando o site bloqueia |

- **Seus dados ficam no seu computador.** A extensão não faz nenhuma requisição de rede, não tem
  servidor e não coleta nada.
- O texto da página só é lido **na hora da expansão**, e só quando o snippet usa `{site}`.
- O Atalho só reage a **digitação real** (eventos confiáveis), então um site não consegue "fingir"
  que digitou um atalho para roubar o seu clipboard.
- Sem código remoto, sem `eval`/`new Function` (o CI confere o build) e sem inserir HTML vindo do
  usuário ou da página.

---

## Desenvolvimento

Requisitos: **Node 22+**. Tudo roda dentro de `TypeScript/atalho/`:

```bash
npm install            # instala e prepara o WXT
npm run dev            # abre um Chrome com a extensão e recarrega a cada mudança
npm run lint           # ESLint (com checagem de tipos) + tsc
npm test               # Vitest + jsdom
npm run build          # gera .output/chrome-mv3/
npm run check:no-eval  # falha se o build tiver eval( ou new Function(
```

**Stack:** [WXT](https://wxt.dev) (MV3), TypeScript strict, dayjs, Vitest + jsdom. O dashboard é TS
puro, sem framework. O React entra só nos testes, para validar a inserção num input React de verdade.

### Arquitetura
```text
src/
├── engine/        # núcleo puro: não conhece chrome.* nem document/window globais
│   ├── parser/    # template → AST (guiado pelo schema de cada comando, com recuperação de erros)
│   ├── evaluator/ # AST → texto (assíncrono; erros viram [ERRO: ...] sem derrubar o resto)
│   ├── commands/  # {site}, {time}, {clipboard}: um arquivo por comando
│   └── functions/ # extractregex, catch
├── content/       # na página: detecta o atalho, lê o cursor, insere o texto, mostra o aviso
├── storage/       # CRUD dos snippets, validação de atalhos, backup
├── dashboard/     # lógica do dashboard (preview com página simulada)
├── background/ + offscreen/   # plano B do clipboard
└── entrypoints/   # pontos de entrada do WXT (content, background, options, offscreen)
```
- Tudo o que vem de fora (página, clipboard, relógio) chega ao motor pela interface `RenderContext`.
  Assim o mesmo motor roda na página, no preview do dashboard e nos testes.
- Novo comando = um arquivo em `engine/commands/` com a sintaxe (o parser lê o schema) e o `run`.
  O parser já tem ponto de extensão para blocos (`{if}...{endif}`) e operadores.
- Os testes do parser e dos comandos foram escritos **antes** da implementação (TDD).

### Testes
- `tests/` espelha `src/`: parser, avaliador, cada comando, funções, inserção (input, textarea,
  contenteditable, React 19 real, editores ricos), storage (com o `fakeBrowser` do WXT), dashboard
  (com o HTML real da página de opções) e o roteiro manual.
- [`TESTES_MANUAIS.md`](TESTES_MANUAIS.md): roteiro para testar no Chrome em sites reais, com os
  snippets de teste prontos em [`snippets-de-teste.json`](snippets-de-teste.json).

### CI
O workflow [`.github/workflows/atalho.yml`](../../.github/workflows/atalho.yml) roda a cada push na
`main` e em pull requests: `npm ci` → lint → testes → build → checagem de `eval` → publica a extensão
como artifact **`atalho-chrome-mv3`**.

Regras do projeto e referência de sintaxe para quem for mexer no código (inclusive o Claude Code):
[`CLAUDE.md`](CLAUDE.md).

---

## Próximas fases
- **Fase 2:** `{if}`/`{else}`, operadores e números nas fórmulas, `{repeat}`, somar/subtrair datas no `{time}`.
- **Fase 3:** formulários no snippet (`{formtext}`, `{formmenu}`...), `{urlload}`, ler outra aba (`page=`).
- **Depois:** rich text, sincronizar entre computadores, escolher o seletor clicando na página.
