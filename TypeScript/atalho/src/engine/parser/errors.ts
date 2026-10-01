import type { ParseError, Span } from './ast';

/**
 * Erro INTERNO do parser, usado enquanto ele lê um comando "{...}".
 *
 * Ao achar um problema, as funções do parser lançam um TagError. Ele é
 * capturado em parse-template.ts, que transforma o comando inteiro num
 * ErrorNode e continua lendo o resto do snippet. Por isso o usuário nunca
 * vê uma exceção: no máximo vê uma mensagem de erro no lugar do comando.
 */
export class TagError extends Error {
  constructor(
    message: string,
    /** Onde exatamente está o problema (ex.: só a palavra "URL"). */
    readonly span: Span,
  ) {
    super(message);
    this.name = 'TagError';
  }
}

/** Converte um índice do texto em linha e coluna (ambas começando em 1). */
export function locate(source: string, offset: number): { line: number; column: number } {
  let line = 1;
  let lineStart = 0;
  for (let i = 0; i < offset; i++) {
    if (source[i] === '\n') {
      line++;
      lineStart = i + 1;
    }
  }
  return { line, column: offset - lineStart + 1 };
}

/** Monta o ParseError "público", já com linha e coluna. */
export function createParseError(source: string, message: string, span: Span): ParseError {
  return { message, span, ...locate(source, span.start) };
}
