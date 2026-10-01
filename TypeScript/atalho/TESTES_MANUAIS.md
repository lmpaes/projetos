# Testes manuais do Atalho (Fase 1)

Roteiro para testar a extensão no Chrome de verdade, feito por você ou pelo **Claude in Chrome**.
Os testes automáticos (Vitest + jsdom) cobrem a lógica, mas não um navegador real com sites reais.
É isso que este roteiro confere.

Cada caso traz **página**, **snippet**, **ação** e **resultado esperado**. Marque ✅ ou ❌ na
[tabela do final](#tabela-de-resultados) e anote o que viu quando der diferente.

> Os resultados esperados dos snippets são conferidos automaticamente pelo teste
> `tests/docs/manual-tests.test.ts` usando páginas parecidas com as reais. Se algo der diferente
> aqui, o mais provável é a página ter mudado ou o navegador se comportar diferente do jsdom, e é
> exatamente isso que queremos descobrir.

---

## 0. Preparação (uma vez só)

1. **Instale a versão mais recente** da extensão seguindo o [README](README.md#instalação). Se já
   estava instalada, atualize (troque os arquivos, clique em ↻ em `chrome://extensions`).
2. **Baixe os snippets de teste:** no GitHub, abra o arquivo
   [`TypeScript/atalho/snippets-de-teste.json`](snippets-de-teste.json) (na branch do PR ou na
   `main` depois do merge) e clique no botão **Download raw file** (ícone ⤓ no canto do arquivo).
3. **Importe:** clique no ícone do Atalho → dashboard → **Importar backup** → escolha o arquivo →
   deixe **Mesclar** marcado → **Importar**.
   - Esperado: a mensagem "13 importados, 0 pulados" e 13 snippets "Teste 01…13" na lista. Os seus
     snippets (`/ola`, `/pag`, `/atd`...) continuam lá.
4. **Recarregue (F5)** as abas que já estavam abertas antes de instalar ou atualizar a extensão.

Os atalhos de teste começam com `/t-` (ex.: `/t-nome`) para não esbarrar nos seus.

### Como "digitar o atalho"
Clique no campo e digite o atalho normalmente. A troca acontece **assim que você digita o último
caractere**, sem precisar de Espaço nem Enter. O **Ctrl+Z** desfaz a expansão e devolve o atalho.

### Notas para o Claude in Chrome
- O Atalho **só reage a digitação real** (eventos com `isTrusted`). Isso é proposital: impede que um
  site malicioso "finja" digitar um atalho para ler seu clipboard. Então o Claude precisa usar a ação
  de **digitar com o teclado**, e não alterar o valor do campo por JavaScript. Se nada expandir
  quando o Claude digita, mas expandir quando **você** digita, a extensão está certa: anote
  "não expande com digitação automática" e siga.
- As páginas `chrome://extensions` e o dashboard (`chrome-extension://...`) costumam ser
  bloqueadas para automação. Faça a **Preparação** e o **Bloco C** você mesmo.
- Prompt sugerido (copie e cole um bloco por vez):

  ```text
  Vou testar minha extensão de snippets "Atalho". Para cada caso abaixo: abra a página,
  clique no campo indicado, digite o atalho como teclas reais (não cole e não use JavaScript),
  espere 1 segundo e me diga exatamente o texto que ficou no campo e se apareceu algum aviso
  no canto inferior direito da página. Compare com o "Esperado" e responda ✅ ou ❌ por caso.
  [cole aqui os casos do bloco]
  ```

---

## Bloco A: comandos (página de formulário do httpbin)

Página para todo o bloco:
**https://httpbin.org/forms/post?id=123&tab=x#detalhes**

É um formulário de pedido de pizza que não envia nada se você não clicar em "Submit order". Campos
usados: **Customer name** (input de texto), **E-mail address** (input de e-mail) e **Delivery
instructions** (a caixa grande, uma textarea).

> **Se o httpbin estiver fora do ar** (ele cai de vez em quando): use
> `https://www.google.com/search?q=teste&id=123#detalhes` e digite na caixa de busca do topo.
> Os valores mudam conforme o endereço (o Google pode acrescentar parâmetros): compare sempre com
> o que está na barra de endereço. O A2/A3 não funcionam lá (não há `<legend>`); pule-os.

### A1. Partes da URL (textarea)
- **Snippet:** `/t-partes` (Teste 01)
  ```text
  url: {site: url}
  domain: {site: domain}
  path: {site: path}
  protocol: {site: protocol}
  query: {site: query}
  hash: {site: hash}
  title: {site: title}
  ```
- **Ação:** clique em **Delivery instructions** e digite `/t-partes`.
- **Esperado:**
  ```text
  url: https://httpbin.org/forms/post?id=123&tab=x#detalhes
  domain: httpbin.org
  path: /forms/post
  protocol: https
  query: ?id=123&tab=x
  hash: #detalhes
  title:
  ```
  O `title` sai **igual ao nome da aba**. Essa página não tem `<title>`, então sai vazio (a aba
  mostra o endereço). Se aparecer algum título, confira se ele bate com o nome da aba.

### A2. `{site: text; selector=...}`: primeiro elemento
- **Snippet:** `/t-seletor` (Teste 02): `{site: text; selector=legend}`
- **Ação:** na mesma caixa, digite `/t-seletor`.
- **Esperado:** `Pizza Size` (o título do 1º grupo de opções da página).

### A3. `multiple=yes`: todos os elementos
- **Snippet:** `/t-lista` (Teste 03): `{site: text; selector=legend; multiple=yes}`
- **Ação:** digite `/t-lista`.
- **Esperado:** `Pizza Size, Pizza Toppings`

### A4. `extractregex` pegando o `id=` da URL
- **Snippet:** `/t-id` (Teste 04): `ID: {=extractregex({site: query}, "id=([^&]+)")}`
- **Ação:** digite `/t-id`.
- **Esperado:** `ID: 123`
- **Variação:** troque o endereço para `https://httpbin.org/forms/post?id=ABC-9&tab=x`, aperte
  Enter e repita. **Esperado:** `ID: ABC-9`. Prova que ele lê a URL na hora da expansão.

### A5. Variável
- **Snippet:** `/t-var` (Teste 05):
  `{pedido=extractregex({site: query}, "id=([^&]+)")}Pedido nº {=pedido} em {site: domain}`
- **Ação:** volte para `?id=123&tab=x#detalhes` e digite `/t-var`.
- **Esperado:** `Pedido nº 123 em httpbin.org`. A parte `{pedido=...}` não aparece no texto: ela
  só guarda o valor.

### A6. Seletor que não existe, SEM `catch`
- **Snippet:** `/t-erro` (Teste 06): `Antes {site: text; selector=.nao-existe} depois`
- **Ação:** digite `/t-erro`.
- **Esperado:**
  1. No campo:
     ```text
     Antes [ERRO: {site}: nenhum elemento encontrado para o seletor ".nao-existe" (use catch() para definir um texto padrão)] depois
     ```
     O erro fica só no trecho com problema e o resto do snippet ("Antes", "depois") aparece normal.
  2. Um aviso no **canto inferior direito** da página: "Atalho: /t-erro foi expandido com 1 erro",
     com a mensagem e a dica sobre `[ERRO: ...]`. Ele some sozinho em ~8 s ou no ×.

### A7. Seletor que não existe, COM `catch`
- **Snippet:** `/t-catch` (Teste 07):
  `Vendedor: {=catch({site: text; selector=.nao-existe}, "Não encontrado")}`
- **Ação:** digite `/t-catch`.
- **Esperado:** `Vendedor: Não encontrado`, **sem** aviso no canto.

### A8. Data e hora
- **Snippet:** `/t-hora` (Teste 08): `{time: DD/MM/YYYY [às] HH:mm} ({time: dddd})`
- **Ação:** digite `/t-hora`.
- **Esperado:** a data e hora **de agora**, em português. Ex.: `01/10/2026 às 14:30 (quinta-feira)`.

### A9. Área de transferência
- **Snippet:** `/t-clip` (Teste 09): `Copiado: {clipboard}`
- **Ação:** selecione e copie (Ctrl+C) qualquer texto, por exemplo `Atalho funcionando`. Clique na
  caixa e digite `/t-clip`.
- **Esperado:** `Copiado: Atalho funcionando`.
  - O Chrome **pode** perguntar se o site pode "ver texto e imagens copiados". Tanto **Permitir**
    quanto **Bloquear** devem funcionar: se a página bloquear, a extensão lê por outro caminho (o
    documento offscreen). Anote qual você escolheu.
  - Se aparecer `[ERRO: ... área de transferência ...]`, anote a mensagem completa do aviso.

### A10. Texto selecionado na página
- **Snippet:** `/t-selecao` (Teste 13): `Selecionado: {site: selection}`
- **Ação:** com o mouse, selecione o texto **Pizza Toppings** na página. Depois clique na caixa
  Delivery instructions (a seleção some, é normal) e digite `/t-selecao`.
- **Esperado:** `Selecionado: Pizza Toppings`. A extensão lembra a última seleção feita **fora**
  de um campo.

### A11. Input de texto simples
- **Snippet:** `/t-nome` (Teste 10): `Maria Silva`
- **Ação:** clique em **Customer name** e digite `/t-nome`.
- **Esperado:** `Maria Silva`.

### A12. Input de e-mail
- **Ação:** clique em **E-mail address** e digite `/t-nome`.
- **Esperado:** `Maria Silva`. Esse tipo de campo não informa a posição do cursor, então a
  extensão assume que ele está no fim.

### A13. Desfazer (Ctrl+Z)
- **Ação:** logo depois do A11, aperte **Ctrl+Z** no Customer name.
- **Esperado:** o campo volta a mostrar `/t-nome`. Ctrl+Z de novo apaga o que você digitou.

### A14. Várias linhas na textarea
- **Snippet:** `/t-linhas` (Teste 11):
  ```text
  Olá!
  Esta é a linha 2.
  Data: {time: DD/MM/YYYY}
  ```
- **Ação:** apague a Delivery instructions e digite `/t-linhas`.
- **Esperado:** as 3 linhas, com a data de hoje na última. O cursor fica no fim do texto.

---

## Bloco B: outros tipos de campo e editores

### B1. contenteditable simples (MDN)
- **Página:** https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/contenteditable
  (se redirecionar para outro endereço do MDN, tudo bem).
- **Snippet:** `/t-nome` e `/t-linhas`.
- **Ação:** no exemplo interativo do topo ("Edit this content to add your own quote"), clique no fim
  do texto da citação, digite um espaço e `/t-nome`. Depois aperte Enter e digite `/t-linhas`.
- **Esperado:** `Maria Silva` no fim da citação e, abaixo, as 3 linhas do Teste 11.
- **Se a página mudou** (sem exemplo editável): use o B2 (Gmail), que também é contenteditable.

### B2. Gmail (contenteditable de verdade)
- **Página:** https://mail.google.com → **Escrever**.
- **Ação:**
  1. No **Assunto** (input), digite `/t-nome`. **Esperado:** `Maria Silva`.
  2. No **corpo** do e-mail, digite `/t-linhas`. **Esperado:** as 3 linhas, com quebras de linha.
  3. No corpo, Ctrl+Z. **Esperado:** volta `/t-linhas`.
- Não precisa enviar o e-mail: descarte o rascunho no fim.

### B3. Input controlado pelo React
- **Página:** https://react.dev/reference/react-dom/components/input
- **Onde:** role até a seção **"Controlling an input with a state variable"**. O exemplo tem o campo
  **First name:** e, embaixo do código, um preview que mostra "Your name is ...".
- **Snippet:** `/t-nome`
- **Ação:** clique em **First name** (no preview) e digite `/t-nome`. Depois digite ` Jr`.
- **Esperado:**
  1. O campo mostra `Maria Silva` **e** aparece o parágrafo `Your name is Maria Silva.` Isso prova
     que o React "viu" a mudança. Se o campo mudar mas o parágrafo não aparecer, ❌.
  2. Depois do ` Jr`: `Your name is Maria Silva Jr.` (o texto não some nem volta para `/t-nome`).
- **Observação:** o preview fica num iframe de outro domínio (sandbox). A expansão funciona lá
  dentro, mas um `{site: url}` ali leria o endereço do sandbox, e não do react.dev (limitação
  conhecida, ver README).
- **Se o preview não carregar:** clique no botão de recarregar do próprio sandbox ou role a página
  um pouco (ele carrega quando aparece na tela).

### B4. Editor rico CKEditor 5 (o mesmo tipo do Zendesk)
- **Página:** https://ckeditor.com/ckeditor-5/demo/ (qualquer editor de demonstração da página).
- **Snippet:** `/t-linhas` e `/t-nome`
- **Ação:** clique no fim de um parágrafo do editor, aperte Enter e digite `/t-linhas`. Depois,
  Ctrl+Z.
- **Esperado:** as 3 linhas aparecem (podem virar 3 parágrafos, normal no CKEditor). O Ctrl+Z
  devolve `/t-linhas`, sem apagar o resto do texto do editor.
- Se aparecer um menu ao digitar `/` (alguns demos têm "comandos de barra"), continue digitando: o
  atalho deve expandir mesmo assim.
- **Teste real:** no **Zendesk**, numa resposta de ticket, o seu `/atd` (Etapa 7.1) deve continuar
  funcionando, inclusive o número do protocolo vindo da URL.

### B5. Campo de senha é ignorado (segurança)
- **Página:** https://the-internet.herokuapp.com/login
- **Ação:**
  1. No campo **Password**, digite `/t-nome`. **Esperado:** nada muda (continua o que você
     digitou, em bolinhas). A extensão nunca expande em senha.
  2. No campo **Username**, digite `/t-nome`. **Esperado:** `Maria Silva`.

### B6. `{site}` em outra página estável (título e seletor)
- **Página:** a mesma do B5.
- **Snippet:** `/t-pagina` (Teste 12): `{site: title} | {site: text; selector=h2}`
- **Ação:** apague o Username e digite `/t-pagina`.
- **Esperado:** `The Internet | Login Page`

---

## Bloco C: dashboard (faça você mesmo)

Abra o dashboard pelo ícone do Atalho.

### C1. Criar um snippet e usar
- **Ação:** **+ Novo snippet** → Nome `Assinatura`, Atalho `/sig`, Conteúdo:
  ```text
  Att,
  Leo
  {time: DD/MM/YYYY}
  ```
  Olhe o **Preview** antes de salvar e depois clique em **Salvar** (ou Ctrl+S).
- **Esperado:** o preview mostra as 3 linhas com a data de hoje; depois de salvar, "Assinatura"
  aparece na lista. Na aba do httpbin (sem F5), digitar `/sig` na textarea expande o texto.

### C2. Atalho duplicado bloqueia
- **Ação:** **+ Novo snippet** → Atalho `/t-nome`.
- **Esperado:** mensagem vermelha `Já existe um snippet com o atalho /t-nome ("Teste 10: texto
  simples").` e o botão **Salvar** desabilitado.

### C3. Conflito de prefixo avisa
- **Ação:** troque o Atalho para `/t-n`.
- **Esperado:** aviso amarelo `Este atalho vai disparar antes de você terminar de digitar /t-nome
  ("Teste 10: texto simples"). Troque um dos dois atalhos.` O Salvar continua habilitado (é só
  aviso). **Não salve**: clique em outro snippet e confirme descartar.

### C4. Preview com erro (linha e coluna)
- **Ação:** **+ Novo snippet** → Conteúdo:
  ```text
  Olá
  {site: URL}
  ```
- **Esperado:** o preview mostra `Olá` e um `[ERRO: Valor inválido 'URL' em {site}...]`, e a lista
  embaixo dele diz `Linha 2, coluna 1: ...` (com a dica de que maiúsculas importam). Descarte.

### C5. Página de teste do preview
- **Ação:** selecione **Teste 04** (`/t-id`), abra **"Página de teste"** e troque a URL para
  `https://loja.com/pedidos/555?id=999`.
- **Esperado:** o preview muda para `ID: 999` sem salvar nada. Volte a URL ao que era (ou recarregue
  o dashboard).

### C6. Edição vale na hora, sem F5
- **Ação:** edite o **Teste 10** trocando `Maria Silva` por `Maria Souza` e salve. Na aba do
  httpbin (sem recarregar), digite `/t-nome`.
- **Esperado:** `Maria Souza`. Depois volte para `Maria Silva`.

### C7. Exportar backup
- **Ação:** clique em **Exportar backup**.
- **Esperado:** baixa `atalho-backup-AAAA-MM-DD.json` (data de hoje) com todos os seus snippets.
  Guarde-o: ele serve de segurança para os próximos passos.

### C8. Importar de novo (mesclar pula repetidos)
- **Ação:** **Importar backup** → o arquivo do C7 → **Mesclar** → **Importar**.
- **Esperado:** "0 importados, N pulados", e o relatório diz que cada um foi pulado porque o atalho
  já existe. Nada é duplicado na lista.
- **Substituir tudo** (opcional): apaga tudo e usa só o arquivo, pedindo confirmação antes. Só teste
  com o backup do C7 em mãos.

### C9. Excluir
- **Ação:** selecione **Assinatura** (do C1) → **Excluir** → confirme.
- **Esperado:** some da lista; digitar `/sig` numa página não faz mais nada.

### C10. Modo diagnóstico
- **Ação:** no dashboard, abra **Configurações** e ligue **Modo diagnóstico**. Na aba do httpbin,
  aperte **F12** → aba **Console** e digite `/t-nome` na textarea.
- **Esperado:** linhas começando com `[Atalho]`, como `atalho encontrado` e `inserido via
  execCommand`. **Desligue** no fim (com ele desligado, o console fica limpo).

---

## Bloco D: limitações conhecidas (o esperado é NÃO funcionar)

| Caso | Ação | Esperado |
|---|---|---|
| D1 | Digitar `/t-nome` na barra de endereço ou em `chrome://extensions` | Nada (o Chrome não deixa extensões rodarem ali) |
| D2 | Digitar `/t-nome` num documento do Google Docs | Nada (o Docs não usa campos de texto comuns; fora do escopo) |
| D3 | Recarregar a extensão (↻) e digitar numa aba **sem** F5 | Nada. Depois de F5, volta a funcionar |

---

## Tabela de resultados

| Caso | ✅/❌ | Observação |
|---|---|---|
| Preparação (import dos 13 snippets) | | |
| A1 partes da URL | | |
| A2 seletor 1º elemento | | |
| A3 multiple=yes | | |
| A4 extractregex id (+ variação) | | |
| A5 variável | | |
| A6 seletor inexistente sem catch (+ aviso) | | |
| A7 seletor inexistente com catch | | |
| A8 data e hora | | |
| A9 clipboard (Permitir/Bloquear?) | | |
| A10 seleção | | |
| A11 input de texto | | |
| A12 input de e-mail | | |
| A13 Ctrl+Z | | |
| A14 várias linhas (textarea) | | |
| B1 contenteditable (MDN) | | |
| B2 Gmail | | |
| B3 React | | |
| B4 CKEditor 5 / Zendesk | | |
| B5 senha ignorada | | |
| B6 título + h2 | | |
| C1–C10 dashboard | | |
| D1–D3 limitações | | |

## Se algo falhar
1. Ligue o **Modo diagnóstico** (C10), repita o caso com o **Console** aberto (F12).
2. Copie as linhas `[Atalho]` do console e tire um print do campo e do aviso, se houver.
3. Mande para o Claude com: o caso (ex.: B3), a página, o que você esperava e o que aconteceu.
