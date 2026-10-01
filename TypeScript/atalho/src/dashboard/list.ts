import type { Snippet, SnippetInput } from '@/shared/types';

export const EMPTY_DRAFT: SnippetInput = { name: '', shortcut: '', content: '' };

/** ETAPA 7 (TDD): ainda não implementado. */
export function sortSnippets(snippets: readonly Snippet[]): Snippet[] {
  void snippets;
  throw new Error('sortSnippets: não implementado (etapa 7)');
}

/** ETAPA 7 (TDD): ainda não implementado. */
export function filterSnippets(snippets: readonly Snippet[], query: string): Snippet[] {
  void snippets;
  void query;
  throw new Error('filterSnippets: não implementado (etapa 7)');
}

/** ETAPA 7 (TDD): ainda não implementado. */
export function draftFrom(snippet: Snippet | null): SnippetInput {
  void snippet;
  throw new Error('draftFrom: não implementado (etapa 7)');
}

/** ETAPA 7 (TDD): ainda não implementado. */
export function isDirty(draft: SnippetInput, baseline: SnippetInput): boolean {
  void draft;
  void baseline;
  throw new Error('isDirty: não implementado (etapa 7)');
}
