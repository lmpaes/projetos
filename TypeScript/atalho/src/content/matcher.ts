import type { Snippet } from '@/shared/types';

export interface ShortcutMatcher {
  /** Tamanho do maior atalho (quanto texto precisamos ler antes do cursor). */
  readonly maxLength: number;
  /** Algum atalho termina com este caractere? (filtro rápido a cada tecla) */
  couldEndWith(char: string): boolean;
  /** Snippet cujo atalho termina exatamente no fim do texto (o mais longo vence). */
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

  return {
    maxLength: sorted[0]?.shortcut.length ?? 0,
    couldEndWith: (char) => lastChars.has(char),
    match: (text) => sorted.find((snippet) => text.endsWith(snippet.shortcut)) ?? null,
  };
}
