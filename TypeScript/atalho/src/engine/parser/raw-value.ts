import type { Span } from './ast';
import { TagError } from './errors';
import type { ParserState } from './parser-state';
import { isWhitespace } from './scanner';

/** Depois de "\", estes caracteres viram literais (a barra some). */
const RAW_ESCAPABLE = new Set([';', '{', '}', '\\']);

/** Para cada caractere de fechamento, qual é o de abertura correspondente. */
const CLOSER_TO_OPENER: Readonly<Record<string, string>> = { ']': '[', ')': '(' };

export interface RawValue {
  text: string;
  span: Span;
}

/**
 * Lê um argumento "cru" (seletor CSS, formato de data...) até o próximo ";" ou "}".
 *
 * Exemplos (o que está entre ⟨ ⟩ é o valor lido):
 *   {site: text; selector=⟨.cliente .nome⟩}
 *   {site: text; selector=⟨a[title="x;y}"]⟩}  ← ";" e "}" dentro de "..." ou [...] não contam
 *   {time: ⟨HH\;mm⟩}                           ← "\;" vira ";" literal
 *
 * O cursor para EM CIMA do ";" ou "}" (quem chamou decide o que fazer com ele).
 */
export function scanRawValue(state: ParserState): RawValue {
  const s = state.scanner;
  const start = s.pos;
  let text = '';
  /** Pilha de "[" e "(" abertos, com a posição de cada um (para mensagens de erro). */
  const openers: Array<{ char: string; pos: number }> = [];
  /** Posição das aspas abertas, ou -1 se não estamos dentro de aspas. */
  let quoteStart = -1;

  for (;;) {
    if (s.atEnd) {
      // Chegamos ao fim do texto sem achar o fim do valor: dizemos o que ficou aberto.
      if (quoteStart >= 0) {
        throw new TagError('Aspas (") não fechadas no valor', { start: quoteStart, end: quoteStart + 1 });
      }
      const open = openers.at(-1);
      if (open) {
        throw new TagError(`Faltou fechar o '${open.char}' aberto aqui`, {
          start: open.pos,
          end: open.pos + 1,
        });
      }
      throw state.unclosedTagError();
    }

    const char = s.peek();

    // Escapes: "\;" → ";"  |  outras combinações (ex.: "\:" do CSS) ficam como estão.
    if (char === '\\') {
      const next = s.peek(1);
      if (RAW_ESCAPABLE.has(next)) {
        text += next;
        s.advance(2);
      } else {
        text += char + next;
        s.advance(next === '' ? 1 : 2);
      }
      continue;
    }

    // Dentro de aspas, tudo é literal até fechar as aspas.
    if (quoteStart >= 0) {
      if (char === '"') quoteStart = -1;
      text += char;
      s.advance();
      continue;
    }

    if (char === '"') {
      quoteStart = s.pos;
    } else if (char === '[' || char === '(') {
      openers.push({ char, pos: s.pos });
    } else if (CLOSER_TO_OPENER[char] !== undefined && openers.at(-1)?.char === CLOSER_TO_OPENER[char]) {
      openers.pop();
    } else if (openers.length === 0) {
      // Só no "nível de fora" (fora de aspas e colchetes) ";" e "}" encerram o valor.
      if (char === ';' || char === '}') break;
      if (char === '{') {
        throw new TagError(
          String.raw`Chave '{' inesperada no valor. Para escrever uma chave literal, use \{`,
          { start: s.pos, end: s.pos + 1 },
        );
      }
    }

    text += char;
    s.advance();
  }

  // Apara espaços das pontas, tanto no texto quanto no span (posição no original).
  let spanStart = start;
  let spanEnd = s.pos;
  while (spanStart < spanEnd && isWhitespace(s.source[spanStart] ?? '')) spanStart++;
  while (spanEnd > spanStart && isWhitespace(s.source[spanEnd - 1] ?? '')) spanEnd--;

  return { text: text.trim(), span: { start: spanStart, end: spanEnd } };
}
