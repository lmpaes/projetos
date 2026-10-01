// =============================================================================
// Scanner: um "cursor" que anda pelo texto do snippet, caractere por caractere.
// -----------------------------------------------------------------------------
// Todas as partes do parser compartilham o MESMO scanner. Quando uma função lê
// algo (um nome, um texto entre aspas...), ela avança o cursor e a próxima
// função continua de onde a anterior parou.
// =============================================================================

// \p{L} = qualquer letra Unicode (inclui á, ç, ñ...), \p{N} = números,
// \p{M} = marcas combinantes (acentos "soltos" que se juntam à letra anterior).
const IDENTIFIER_START = /[\p{L}_]/u;
const IDENTIFIER_PART = /[\p{L}\p{M}\p{N}_]/u;
const WHITESPACE = /\s/;

/** O caractere pode começar um nome (de comando, variável ou função)? */
export function isIdentifierStart(char: string): boolean {
  return char !== '' && IDENTIFIER_START.test(char);
}

export function isWhitespace(char: string): boolean {
  return char !== '' && WHITESPACE.test(char);
}

export class Scanner {
  /** Posição atual do cursor (índice no texto). */
  pos = 0;

  constructor(readonly source: string) {}

  /** O cursor chegou ao fim do texto? */
  get atEnd(): boolean {
    return this.pos >= this.source.length;
  }

  /** Olha o caractere na posição atual (+offset) SEM avançar. Fim do texto → ''. */
  peek(offset = 0): string {
    return this.source[this.pos + offset] ?? '';
  }

  /** Avança o cursor. */
  advance(count = 1): void {
    this.pos += count;
  }

  /** Pula espaços, tabs e quebras de linha. */
  skipWhitespace(): void {
    while (isWhitespace(this.peek())) this.pos++;
  }

  /** Lê um nome (ex.: "site", "extractregex", "preço") e avança o cursor. */
  readIdentifier(): string {
    const start = this.pos;
    while (!this.atEnd && IDENTIFIER_PART.test(this.peek())) this.pos++;
    return this.source.slice(start, this.pos);
  }
}
