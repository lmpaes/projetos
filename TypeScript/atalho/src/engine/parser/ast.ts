// =============================================================================
// AST (Abstract Syntax Tree = "árvore sintática")
// -----------------------------------------------------------------------------
// O parser lê o texto do snippet, por exemplo:
//
//     Olá! Pedido {=extractregex({site: path}, "/([^/]+)$")}
//
// e o transforma numa lista de "nós" (objetos simples) que o avaliador sabe
// executar depois:
//
//     [ { type: 'text', value: 'Olá! Pedido ' },
//       { type: 'formula', expr: { type: 'call', name: 'extractregex', args: [...] } } ]
//
// Todo nó tem um "span": o trecho [start, end) do texto original de onde ele
// veio. É assim que o dashboard consegue apontar "erro na linha 2, coluna 10".
// =============================================================================

/** Trecho do texto-fonte: índices de caractere, início incluso e fim excluso. */
export interface Span {
  start: number;
  end: number;
}

// -----------------------------------------------------------------------------
// Nós do template (o "nível de cima" do snippet)
// -----------------------------------------------------------------------------

export type Node = TextNode | CommandNode | FormulaNode | AssignNode | BlockNode | ErrorNode;

/** Texto puro, já com os escapes resolvidos (\{ vira {). */
export interface TextNode {
  type: 'text';
  value: string;
  span: Span;
}

/**
 * Um comando: {clipboard}, {site: text; selector=.nome}, {time: DD/MM/YYYY}.
 * - positional: o argumento depois de ":" (ex.: "text"), ou null se não houver.
 * - settings: os pares chave=valor depois de ";" (ex.: { selector: ... }).
 */
export interface CommandNode {
  type: 'command';
  name: string;
  positional: ArgValue | null;
  settings: Record<string, ArgValue>;
  span: Span;
}

/**
 * Valor de um argumento. O formato depende do que o comando declarou
 * no seu ArgSpec (ver syntax.ts):
 * - 'raw': texto cru, ex.: o seletor CSS ".cliente .nome";
 * - 'expr': uma expressão de fórmula, ex.: o {if: ...} das próximas fases.
 * (Fase 3 deve adicionar 'template', para textos com comandos dentro.)
 */
export type ArgValue = RawArg | ExprArg;

export interface RawArg {
  kind: 'raw';
  text: string;
  span: Span;
}

export interface ExprArg {
  kind: 'expr';
  expr: Expr;
  span: Span;
}

/** {=expressão}: avalia a expressão e insere o resultado no texto. */
export interface FormulaNode {
  type: 'formula';
  expr: Expr;
  span: Span;
}

/** {nome=expressão}: guarda o resultado numa variável e NÃO insere nada. */
export interface AssignNode {
  type: 'assign';
  name: string;
  expr: Expr;
  span: Span;
}

/**
 * Comando de bloco, ex. (Fase 2): {if: x}...{elseif: y}...{else}...{endif}
 * Cada "seção" começa num comando (o {if}, o {elseif}, o {else}) e tem um
 * corpo com os nós até a próxima seção. O comando de fechamento ({endif}) é
 * consumido e não aparece na árvore.
 */
export interface BlockNode {
  type: 'block';
  name: string;
  sections: BlockSection[];
  span: Span;
}

export interface BlockSection {
  head: CommandNode;
  body: Node[];
}

/**
 * Um trecho que não pôde ser entendido. O parser NÃO lança exceção: ele
 * registra o erro aqui e continua lendo o resto do snippet.
 * - span: o trecho inteiro problemático (ex.: o comando "{site: URL}" todo);
 * - error.span: o ponto exato do problema (ex.: só o "URL").
 */
export interface ErrorNode {
  type: 'error';
  error: ParseError;
  span: Span;
}

// -----------------------------------------------------------------------------
// Expressões (o que vai dentro de {=...})
// -----------------------------------------------------------------------------

/**
 * Fase 1: textos, variáveis, chamadas de função e comandos embutidos.
 * Fase 2 deve adicionar: números, operadores (=, &, and...), listas, lambdas.
 */
export type Expr = StringLiteral | VariableRef | FunctionCall | CommandNode;

/** "texto entre aspas duplas" */
export interface StringLiteral {
  type: 'string';
  value: string;
  span: Span;
}

/** nome de uma variável, ex.: id */
export interface VariableRef {
  type: 'variable';
  name: string;
  span: Span;
}

/** função(arg1, arg2), ex.: extractregex(texto, "id=(\d+)") */
export interface FunctionCall {
  type: 'call';
  name: string;
  args: Expr[];
  span: Span;
}

// -----------------------------------------------------------------------------
// Resultado do parser
// -----------------------------------------------------------------------------

/** Erro de sintaxe com posição legível para humanos (linha/coluna começam em 1). */
export interface ParseError {
  message: string;
  span: Span;
  line: number;
  column: number;
}

export interface ParseResult {
  nodes: Node[];
  /** Todos os erros encontrados, na ordem em que aparecem no texto. */
  errors: ParseError[];
}
