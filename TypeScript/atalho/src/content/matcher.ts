import { endsWithShortcut } from '@/shared/shortcut';
import type { Snippet } from '@/shared/types';

export interface ShortcutMatcher {
  /**
   * Quantos caracteres ler antes do cursor: o maior atalho + 1. O caractere a
   * mais é o que vem antes do atalho, para conferir se há separador.
   */
  readonly contextLength: number;
  /** Algum atalho termina com este caractere? (filtro rápido a cada tecla) */
  couldEndWith(char: string): boolean;
  /** Snippet cujo atalho termina no fim do texto, separado do que vem antes (o mais longo vence). */
  match(textBeforeCaret: string): Snippet | null;
}

/**
 * Prepara a busca de atalhos. Ordenamos do maior para o menor: assim, se
 * existirem "ig" e "/sig", digitar "/sig" escolhe o "/sig".
 */
export function createMatcher(snippets: readonly Snippet[]): ShortcutMatcher {
  const sorted = snippets
    .filter((snippet) => snippet.shortcut.length > 0)
    .sort((a, b) => b.shortcut.length - a.shortcut.length);
  const lastChars = new Set(sorted.map((snippet) => snippet.shortcut.slice(-1)));
  const longest = sorted[0]?.shortcut.length ?? 0;

  return {
    contextLength: longest === 0 ? 0 : longest + 1,
    couldEndWith: (char) => lastChars.has(char),
    match: (text) => sorted.find((snippet) => endsWithShortcut(text, snippet.shortcut)) ?? null,
  };
}
