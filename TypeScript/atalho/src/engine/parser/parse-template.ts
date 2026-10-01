// =============================================================================
// Parser de templates: o ponto de entrada. Lê o texto do snippet e devolve a AST.
// -----------------------------------------------------------------------------
// Visão geral:
//   1. percorre o texto acumulando texto puro (tratando os escapes \{ \} \\);
//   2. ao achar uma "{" que abre comando, chama parseTag(), que decide se é
//      fórmula {=...}, atribuição {x=...} ou comando {nome...};
//   3. se der erro dentro de um comando, ele vira um ErrorNode e a leitura
//      continua depois do "}" correspondente;
//   4. no fim, monta os blocos ({if}...{endif}) e junta a lista de erros.
// =============================================================================

import type { CommandNode, Node, ParseError, ParseResult } from './ast';
import { buildBlocks } from './build-blocks';
import { createParseError, TagError } from './errors';
import { parseCommandBody } from './parse-command';
import { parseExpression } from './parse-expression';
import type { ParserState } from './parser-state';
import { isIdentifierStart, Scanner } from './scanner';
import type { SyntaxRegistry } from './syntax';

/** No texto puro, estes caracteres podem ser escapados com "\". */
const TEXT_ESCAPABLE = new Set(['{', '}', '\\']);

/**
 * Transforma o texto de um snippet em nós da AST.
 *
 * Nunca lança exceção por causa do texto do usuário: problemas viram ErrorNode
 * no lugar do comando e uma entrada em `errors` (com linha e coluna).
 */
export function parseTemplate(source: string, registry: SyntaxRegistry): ParseResult {
  return new TemplateParser(source, registry).parse();
}

class TemplateParser implements ParserState {
  readonly scanner: Scanner;
  /** Pilha com a posição de cada "{" aberta no momento (comandos podem estar aninhados). */
  private readonly openTags: number[] = [];

  constructor(
    private readonly source: string,
    readonly registry: SyntaxRegistry,
  ) {
    this.scanner = new Scanner(source);
  }

  parse(): ParseResult {
    const flat = this.parseFlatNodes();
    const nodes = buildBlocks(flat, this.registry, (message, span) =>
      createParseError(this.source, message, span),
    );
    return { nodes, errors: collectErrors(nodes) };
  }

  // ---------------------------------------------------------------------------
  // Nível de cima: texto puro intercalado com comandos
  // ---------------------------------------------------------------------------

  private parseFlatNodes(): Node[] {
    const s = this.scanner;
    const nodes: Node[] = [];
    let textStart = s.pos;
    let text = '';

    const flushText = () => {
      if (s.pos > textStart) {
        nodes.push({ type: 'text', value: text, span: { start: textStart, end: s.pos } });
      }
      text = '';
    };

    while (!s.atEnd) {
      const char = s.peek();

      if (char === '\\') {
        const next = s.peek(1);
        if (TEXT_ESCAPABLE.has(next)) {
          text += next; // "\{" → "{"
          s.advance(2);
        } else {
          text += char; // outros "\x" ficam como estão
          s.advance();
        }
        continue;
      }

      if (char === '{' && opensTag(s.peek(1))) {
        flushText();
        nodes.push(this.parseTag());
        textStart = s.pos;
        continue;
      }

      text += char;
      s.advance();
    }

    flushText();
    return nodes;
  }

  // ---------------------------------------------------------------------------
  // Um comando "{...}" no nível de cima
  // ---------------------------------------------------------------------------

  private parseTag(): Node {
    const s = this.scanner;
    const tagStart = s.pos;
    try {
      return this.insideTag(tagStart, (): Node => {
        s.advance(); // "{"

        // {=expressão}
        if (s.peek() === '=') {
          s.advance();
          const expr = parseExpression(this);
          this.expectClosingBrace('a fórmula');
          return { type: 'formula', expr, span: { start: tagStart, end: s.pos } };
        }

        const nameStart = s.pos;
        const name = s.readIdentifier();
        const nameSpan = { start: nameStart, end: s.pos };
        s.skipWhitespace();

        // {nome=expressão}
        if (s.peek() === '=') {
          s.advance();
          const expr = parseExpression(this);
          this.expectClosingBrace(`a atribuição {${name}=...}`);
          return { type: 'assign', name, expr, span: { start: tagStart, end: s.pos } };
        }

        // {nome...}
        return parseCommandBody(this, name, nameSpan, tagStart, false);
      });
    } catch (error) {
      // Erros que não são do usuário (bugs) continuam estourando, para não
      // ficarem escondidos.
      if (!(error instanceof TagError)) throw error;

      // Recuperação: pula até o "}" deste comando e segue lendo o resto.
      const end = findTagEnd(this.source, tagStart);
      s.pos = end;
      return {
        type: 'error',
        error: createParseError(this.source, error.message, error.span),
        span: { start: tagStart, end },
      };
    }
  }

  /** Espera o "}" que fecha a fórmula/atribuição. */
  private expectClosingBrace(what: string): void {
    const s = this.scanner;
    s.skipWhitespace();
    if (s.peek() === '}') {
      s.advance();
      return;
    }
    if (s.atEnd) throw this.unclosedTagError();
    throw new TagError(`Esperava '}' para fechar ${what}, mas encontrei '${s.peek()}'`, {
      start: s.pos,
      end: s.pos + 1,
    });
  }

  // ---------------------------------------------------------------------------
  // ParserState: o que as outras partes do parser usam
  // ---------------------------------------------------------------------------

  /** Comando embutido numa fórmula, ex.: o {site: query} em {=extractregex({site: query}, "...")}. */
  parseEmbeddedCommand(): CommandNode {
    const s = this.scanner;
    const start = s.pos;
    return this.insideTag(start, () => {
      s.advance(); // "{"

      if (s.peek() === '=') {
        throw new TagError(
          'Uma fórmula {=...} não pode ficar dentro de outra fórmula. Escreva a expressão direto, sem "{=" e "}".',
          { start, end: start + 2 },
        );
      }
      if (!isIdentifierStart(s.peek())) {
        throw new TagError("Esperava o nome de um comando depois de '{' (ex.: {site: url})", {
          start,
          end: start + 1,
        });
      }

      const nameStart = s.pos;
      const name = s.readIdentifier();
      const nameSpan = { start: nameStart, end: s.pos };
      s.skipWhitespace();
      if (s.peek() === '=') {
        throw new TagError(`A atribuição {${name}=...} não pode ficar dentro de uma fórmula`, nameSpan);
      }
      return parseCommandBody(this, name, nameSpan, start, true);
    });
  }

  unclosedTagError(): TagError {
    const start = this.openTags.at(-1) ?? this.scanner.pos;
    return new TagError("Faltou fechar a chave '}' do comando que começa aqui", {
      start,
      end: start + 1,
    });
  }

  /** Registra a "{" aberta enquanto `read` roda (para as mensagens de "Faltou fechar"). */
  private insideTag<T>(start: number, read: () => T): T {
    this.openTags.push(start);
    try {
      return read();
    } finally {
      this.openTags.pop();
    }
  }
}

// -----------------------------------------------------------------------------
// Funções auxiliares
// -----------------------------------------------------------------------------

/** Uma "{" só abre comando quando vem COLADA em "=" ou no início de um nome. */
function opensTag(charAfterBrace: string): boolean {
  return charAfterBrace === '=' || isIdentifierStart(charAfterBrace);
}

/**
 * Acha onde termina um comando que deu erro, contando chaves aninhadas e
 * ignorando o que estiver entre aspas. Devolve a posição logo depois do "}"
 * correspondente, ou o fim do texto se ele nunca fechar.
 */
function findTagEnd(source: string, tagStart: number): number {
  let depth = 0;
  let inString = false;
  for (let i = tagStart; i < source.length; i++) {
    const char = source[i];
    if (char === '\\') {
      i++; // pula o caractere escapado
      continue;
    }
    if (inString) {
      if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '{') depth++;
    else if (char === '}') {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return source.length;
}

/** Junta os erros de todos os ErrorNodes, na ordem em que aparecem no texto. */
function collectErrors(nodes: readonly Node[], errors: ParseError[] = []): ParseError[] {
  for (const node of nodes) {
    if (node.type === 'error') errors.push(node.error);
    if (node.type === 'block') {
      for (const section of node.sections) collectErrors(section.body, errors);
    }
  }
  return errors;
}

