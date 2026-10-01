# Atalho — instruções para o Claude Code

Extensão Chrome (MV3 + TypeScript) que expande atalhos de texto em snippets.
É um clone pessoal de estudo do Text Blaze. **Não use o nome nem a marca "Text Blaze"/"Blaze".**
A referência de sintaxe e comportamento do Text Blaze está na segunda metade deste arquivo.

## Comandos (rodar dentro de TypeScript/atalho)
- `npm install`: instala dependências (o postinstall roda `wxt prepare`).
- `npm run lint`: ESLint (type-checked) + `tsc --noEmit`.
- `npm test`: Vitest + jsdom.
- `npm run build`: build em `.output/chrome-mv3/`.
- `npm run check:no-eval`: falha se o build contiver `eval(`/`new Function(`.
- O CI (`.github/workflows/atalho.yml`, na raiz do repo) roda tudo isso e publica o artifact.

## Regras do projeto
- O dono do projeto não tem Node local: tudo precisa passar no CI. Rode lint + test + build antes de cada push.
- Proibido: `eval`, `new Function`, código remoto, `innerHTML` com conteúdo do usuário ou da página.
- `src/engine/` é puro: nada de `chrome.*`/`browser.*` nem de `document`/`window` globais. Página,
  clipboard e relógio entram pela interface `RenderContext`.
- Novos comandos: um arquivo em `src/engine/commands/` com uma `CommandDefinition`, registrado em
  `commands/index.ts`. Novas funções de fórmula: `src/engine/functions/`. O parser é guiado pelo
  schema (`ArgSpec.kind`) e não deve ganhar casos especiais por comando.
- TDD: os testes do parser/engine são escritos antes da implementação.
- Comentários didáticos em pt-BR (o dono tem nível intermediário-iniciante em JS/TS); identificadores em inglês.
- Mensagens de erro para o usuário em pt-BR, claras e acionáveis.
- WXT com `imports: false`: sempre importe explicitamente (`wxt/browser`, `wxt/utils/...`).
- Permissões do manifest ficam em `wxt.config.ts`; só adicione uma quando ela for usada, com justificativa.
- Trabalho em etapas pequenas: um commit por etapa; ao fim de cada uma, liste o que foi feito e o que falta.

## Escopo da Fase 1
Expansão em input/textarea/contenteditable/inputs React; `{site}` (url, domain, path, protocol, query,
hash, title, text, html, selection; `selector=`, `multiple=`), `{time: formato}` (dayjs),
`{clipboard}`, fórmulas `{=...}` com strings, variáveis (`{x=...}`), `extractregex` e `catch`.
Dashboard (options page) com CRUD, preview ao vivo, validação de atalho e backup JSON.
Fora de escopo: formulários, `{if}`, `{repeat}`, `{urlload}`/`{urlsend}`, `page=`, rich text, Google Docs.

---

# CONTEXTO — Text Blaze (extensão de macros/snippets)

## O que é
- Text expander: você salva um texto ("snippet") com um atalho (ex.: /sig) e, ao digitar
  o atalho em qualquer campo do Chrome, ele é substituído pelo conteúdo.
- Plataformas: extensão Chrome/Edge (e Chromium: Brave, Opera, Arc, Vivaldi) + apps
  Windows e macOS. Sem app mobile.
- ATENÇÃO: o app Windows NÃO tem o comando {site} (leitura de páginas) — esse recurso é
  da extensão do navegador.

## Recursos principais
- Formulários dentro do snippet: {formtext}, {formmenu}, {formdate}, {formtoggle}, {formparagraph}
- Lógica: {if}, {repeat}, fórmulas {=...}, listas, regex (extractregex), catch() para erros
- Automação: {key} (Tab/Enter simulados), {click}, Autopilot (preenche vários campos e envia forms)
- Dados: {clipboard}, {time}, {user}, {site} (página), {urlload}/{urlsend} (APIs)
- Integrações: Data Blaze (tabelas: {dbselect/dbinsert/dbupdate/dbdelete}), Command Packs
  (Gmail, LinkedIn etc.), AI Blaze (produto separado para IA)
- Compartilhamento de pastas de snippets com equipe

## Planos (USD, valores variam por fonte)
- Free: 20 snippets, limite de caracteres, recursos avançados restritos
- Pro: ~US$ 2,99/mês (anual) ou ~US$ 3,49 (mensal) — até ~1.000 snippets, forms completos
- Business: ~US$ 6,99/usuário/mês (anual) — pastas de equipe, analytics, admin
- Enterprise: sob consulta

## Extração de dados da URL / página — comando {site}
Lê dados de qualquer aba ABERTA no Chrome. Exemplo para https://test.com/my/page?foo=1#part

| Tipo      | Retorna                               |
|-----------|---------------------------------------|
| url       | https://test.com/my/page?foo=1#part   |
| domain    | test.com                              |
| path      | /my/page                              |
| protocol  | https                                 |
| query     | ?foo=1                                |
| hash      | #part                                 |
| title     | Título da aba                         |
| text / markdown / html | Conteúdo da página       |
| selection / fieldtext / fieldleft / fieldright | Texto selecionado / campo focado |

Case-sensitive: {site: url} funciona, {site: URL} não.

Settings úteis:
- selector=  → CSS selector (ou xpath=) para pegar um elemento específico
- multiple=yes → retorna lista com todos os matches (padrão: só o primeiro)
- page=https://dominio.com/* → lê de OUTRA aba que case com o padrão (wildcard)
- select=yes|no|ifneeded → controla o seletor de abas quando várias casam
- group= → permite ler abas diferentes com o mesmo padrão de page
- frame=self|top → frame/iframe atual ou página principal (padrão top)
- "Select from website": botão no dashboard que gera o selector por point-and-click

## Exemplos práticos
Pegar um parâmetro da query string (ex.: ?id=123&tab=x):
  {=extractregex({site: query}, "id=([^&]+)")}

Pegar o último segmento do path (ex.: /pedidos/98765):
  {=extractregex({site: path}, "/([^/]+)$")}

Texto de um elemento via CSS selector, com fallback:
  {=catch({site: text; selector=.cliente .nome}, "Não encontrado")}

Ler dado de outra aba (ex.: CRM) enquanto escreve no Gmail:
  {site: text; page=https://meucrm.com/*; selector=#email}

Comportamento condicional por site:
  {if: {site: domain} = "mail.google.com"}...{else}...{endif}

## {urlload} — buscar dados de uma URL sem a aba estar aberta
  {urlload: https://api.exemplo.com/{=id}; done=(res) -> ["dados": fromjson(res)]}
Regras/limitações:
- É "Connected Snippet": a pasta precisa ser conectada e o domínio autorizado
- O DOMÍNIO precisa ser fixo (string literal); só path/query podem ser dinâmicos
- Retorna o documento bruto (JSON/HTML); não roda {site}/selector sobre ele → parse via
  fromjson() ou extractregex()
- Não executa JS nem simula cliques: conteúdo carregado dinamicamente não aparece
- {urlsend} faz o inverso (envia dados: POST para APIs, Google Forms etc.)

## Regra de escolha
- Dado está na aba aberta → {site}
- Dado está em API/site que não está aberto → {urlload}
- {site} em erro sem match quebra o snippet → sempre usar catch()