import type { Snippet, SnippetInput } from '@/shared/types';

/** Monta um Snippet completo para os testes (só o que importa é informado). */
export function snippet(overrides: Partial<Snippet> & Pick<Snippet, 'shortcut'>): Snippet {
  return {
    id: `id-${overrides.shortcut}`,
    name: `Snippet ${overrides.shortcut}`,
    content: 'conteúdo',
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

export function input(overrides: Partial<SnippetInput> = {}): SnippetInput {
  return { name: 'Assinatura', shortcut: '/sig', content: 'Att, Leo', ...overrides };
}
