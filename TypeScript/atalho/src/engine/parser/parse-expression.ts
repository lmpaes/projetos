// =============================================================================
// Parser de expressões: o que vai dentro de {=...}, de {nome=...} e dos
// argumentos do tipo 'expr' (ex.: a condição do {if: ...} na Fase 2).
// =============================================================================

import type { Expr, FunctionCall, StringLiteral } from './ast';
import { TagError } from './errors';
import type { ParserState } from './parser-state';
import { isIdentifierStart } from './scanner';

/**
 * Lê uma expressão completa.
 *
 * Fase 1: só existem "valores" (string, variável, chamada, comando embutido),
 * então ler a expressão = ler um valor.
 *
 * Fase 2 (operadores como =, &, and): é aqui que entra o laço do "Pratt parser".
 * Cada operador recebe uma "força" (precedência); depois de ler o valor da
 * esquerda, o laço olha se vem um operador mais forte que o atual e, se vier,
 * lê o lado direito chamando parseExpression de novo. Esboço:
 *
 *   let left = parsePrefix(state);
 *   while (operador à frente com força > forçaMínima) {
 *     consome o operador;
 *     const right = parseExpression(state, forçaDoOperador);
 *     left = { type: 'binary', operator, left, right };
 *   }
 *   return left;
 *
 * Ou seja: adicionar operadores não exige reescrever nada do que existe hoje.
 */
export function parseExpression(state: ParserState): Expr {
  return parsePrefix(state);
}

/** Lê um "valor": "texto", variável, função(...), {comando} ou (expressão). */
function parsePrefix(state: ParserState): Expr {
  const s = state.scanner;
  s.skipWhitespace();
  if (s.atEnd) throw state.unclosedTagError();

  const start = s.pos;
  const char = s.peek();

  if (char === '"') return parseString(state);

  if (char === "'") {
    throw new TagError(
      `Use aspas duplas para textos em fórmulas: "assim". Aspas simples (') não são aceitas.`,
      { start, end: start + 1 },
    );
  }

  if (char === '(') {
    s.advance();
    const inner = parseExpression(state);
    s.skipWhitespace();
    if (s.atEnd) throw state.unclosedTagError();
    if (s.peek() !== ')') {
      throw new TagError("Esperava ')' para fechar o parêntese", { start: s.pos, end: s.pos + 1 });
    }
    s.advance();
    return inner;
  }

  if (char === '{') return state.parseEmbeddedCommand();

  if (isIdentifierStart(char)) {
    const name = s.readIdentifier();
    // Nome colado em "(" é chamada de função; sem "(", é uma variável.
    if (s.peek() === '(') return parseCall(state, name, start);
    return { type: 'variable', name, span: { start, end: s.pos } };
  }

  if (char === '}') {
    throw new TagError('Faltou um valor antes de "}" (expressão vazia). Exemplo: {="texto"}', {
      start,
      end: start + 1,
    });
  }

  if (char === ')' || char === ',' || char === ';') {
    throw new TagError(
      `Esperava um valor (texto entre aspas, variável ou função), mas encontrei '${char}'`,
      { start, end: start + 1 },
    );
  }

  throw new TagError(`Caractere inesperado '${char}' na fórmula`, { start, end: start + 1 });
}

/**
 * Lê "texto entre aspas duplas".
 * Escapes: \" vira aspas e \\ vira uma barra. Qualquer outro \x fica como está,
 * para que regex como "\d+" funcionem sem precisar escrever "\\d+".
 */
function parseString(state: ParserState): StringLiteral {
  const s = state.scanner;
  const start = s.pos;
  s.advance(); // aspas de abertura
  let value = '';

  for (;;) {
    if (s.atEnd) {
      throw new TagError('Faltou fechar as aspas (") do texto', { start, end: start + 1 });
    }
    const char = s.peek();
    if (char === '\\') {
      const next = s.peek(1);
      if (next === '"' || next === '\\') {
        value += next;
        s.advance(2);
      } else {
        value += char;
        s.advance();
      }
      continue;
    }
    if (char === '"') {
      s.advance(); // aspas de fechamento
      return { type: 'string', value, span: { start, end: s.pos } };
    }
    value += char;
    s.advance();
  }
}

/** Lê nome(arg1, arg2, ...). O cursor está em cima do "(". */
function parseCall(state: ParserState, name: string, start: number): FunctionCall {
  const s = state.scanner;
  const nameSpan = { start, end: start + name.length };

  // Conferimos o nome antes de ler os argumentos: se a função não existe,
  // essa é a informação mais útil para o usuário.
  const fn = state.registry.functions.get(name);
  if (!fn) throw new TagError(unknownFunctionMessage(name, state), nameSpan);

  s.advance(); // "("
  const args: Expr[] = [];
  s.skipWhitespace();
  if (s.peek() === ')') {
    s.advance();
  } else {
    for (;;) {
      args.push(parseExpression(state));
      s.skipWhitespace();
      if (s.atEnd) throw state.unclosedTagError();
      const char = s.peek();
      s.advance();
      if (char === ',') continue;
      if (char === ')') break;
      throw new TagError(`Esperava ',' ou ')' na chamada de ${name}(...)`, {
        start: s.pos - 1,
        end: s.pos,
      });
    }
  }

  const span = { start, end: s.pos };
  if (args.length < fn.minArgs || args.length > fn.maxArgs) {
    throw new TagError(
      `${name} espera ${describeArgCount(fn.minArgs, fn.maxArgs)}, mas recebeu ${args.length}`,
      span,
    );
  }
  return { type: 'call', name, args, span };
}

function describeArgCount(min: number, max: number): string {
  const count = min === max ? `${min}` : `de ${min} a ${max}`;
  return `${count} ${max === 1 ? 'argumento' : 'argumentos'}`;
}

function unknownFunctionMessage(name: string, state: ParserState): string {
  const available = [...state.registry.functions.keys()];
  const hint = available.find((fn) => fn.toLowerCase() === name.toLowerCase());
  return (
    `Função desconhecida: ${name}. Funções disponíveis: ${available.join(', ')}.` +
    (hint ? ` Você quis dizer ${hint}? (os nomes diferenciam maiúsculas de minúsculas)` : '')
  );
}
