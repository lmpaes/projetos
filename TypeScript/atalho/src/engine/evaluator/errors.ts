import type { Span } from '../parser';

/**
 * Erro de execução de um snippet, ex.: "nenhum elemento encontrado para .x".
 *
 * Comandos e funções lançam SnippetError com uma mensagem simples. O avaliador
 * acrescenta onde foi (o span e o prefixo "{site}:" / "extractregex:") e decide
 * o destino: ser capturado por catch() ou virar "[ERRO: ...]" no texto.
 */
export class SnippetError extends Error {
  constructor(
    message: string,
    /** Trecho do snippet que causou o erro. Fica vazio até o avaliador preencher. */
    readonly span?: Span,
  ) {
    super(message);
    this.name = 'SnippetError';
  }
}
