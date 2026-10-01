import type { RenderError, RenderResult } from '@/engine';
import type { Snippet } from '@/shared/types';
import type { ShortcutMatcher } from './matcher';

export interface ExpanderOptions {
  /** Matcher com os snippets atuais (o content script troca quando a lista muda). */
  getMatcher(): ShortcutMatcher;
  /** Renderiza o conteúdo do snippet (comandos, fórmulas...). */
  render(content: string): Promise<RenderResult>;
  /** Chamado quando a expansão teve erros (para mostrar o aviso na página). */
  onErrors?(errors: RenderError[], snippet: Snippet): void;
  /**
   * Decide se o evento veio do usuário. Padrão: event.isTrusted.
   * Só os testes trocam isso (o jsdom não gera eventos "confiáveis").
   */
  isTrusted?(event: Event): boolean;
}

/** ETAPA 6 (TDD): ainda não implementado. */
export function attachExpander(doc: Document, options: ExpanderOptions): () => void {
  void doc;
  void options;
  throw new Error('attachExpander: não implementado (etapa 6)');
}
