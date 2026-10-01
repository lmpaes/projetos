import type { Snippet } from '@/shared/types';

export interface ShortcutMatcher {
  /** Tamanho do maior atalho (quanto texto precisamos ler antes do cursor). */
  readonly maxLength: number;
  /** Algum atalho termina com este caractere? (filtro rápido a cada tecla) */
  couldEndWith(char: string): boolean;
  /** Snippet cujo atalho termina exatamente no fim do texto (o mais longo vence). */
  match(textBeforeCaret: string): Snippet | null;
}

/** ETAPA 6 (TDD): ainda não implementado. */
export function createMatcher(snippets: readonly Snippet[]): ShortcutMatcher {
  void snippets;
  throw new Error('createMatcher: não implementado (etapa 6)');
}
