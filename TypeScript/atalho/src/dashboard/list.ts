// Funções puras da lista do dashboard: ordenar, buscar e detectar alterações.
import type { Snippet, SnippetInput } from '@/shared/types';

export const EMPTY_DRAFT: SnippetInput = { name: '', shortcut: '', content: '' };

/** Compara textos como um dicionário em português ("água" vem antes de "Assinatura"). */
const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

/** Cópia da lista ordenada por nome (e por atalho, em caso de empate). */
export function sortSnippets(snippets: readonly Snippet[]): Snippet[] {
  return [...snippets].sort(
    (a, b) => collator.compare(a.name, b.name) || collator.compare(a.shortcut, b.shortcut),
  );
}

/** Remove acentos e maiúsculas: "Olá" → "ola". */
function normalizeForSearch(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/** Snippets cujo nome, atalho ou conteúdo contém a busca. */
export function filterSnippets(snippets: readonly Snippet[], query: string): Snippet[] {
  const needle = normalizeForSearch(query.trim());
  if (needle === '') return [...snippets];
  return snippets.filter((snippet) =>
    [snippet.name, snippet.shortcut, snippet.content].some((field) =>
      normalizeForSearch(field).includes(needle),
    ),
  );
}

/** Campos editáveis de um snippet (ou vazios, para um snippet novo). */
export function draftFrom(snippet: Snippet | null): SnippetInput {
  return snippet
    ? { name: snippet.name, shortcut: snippet.shortcut, content: snippet.content }
    : { ...EMPTY_DRAFT };
}

/** O formulário tem alterações que ainda não foram salvas? */
export function isDirty(draft: SnippetInput, baseline: SnippetInput): boolean {
  return (
    draft.name !== baseline.name ||
    draft.shortcut !== baseline.shortcut ||
    draft.content !== baseline.content
  );
}
