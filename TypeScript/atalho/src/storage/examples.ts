import type { SnippetInput } from '@/shared/types';

/**
 * Snippets de exemplo, cadastrados uma única vez na primeira execução,
 * para testar a extensão antes de criar os seus pelo dashboard.
 */
export const EXAMPLE_SNIPPETS: readonly SnippetInput[] = [
  {
    name: 'Exemplo: saudação com data',
    shortcut: '/ola',
    content: 'Olá! Hoje é {time: dddd, DD [de] MMMM [de] YYYY}.',
  },
  {
    name: 'Exemplo: dados da página',
    shortcut: '/pag',
    content: [
      'Página: {site: title}',
      'Endereço: {site: url}',
      'ID na URL: {=extractregex({site: query}, "id=([^&]+)")}',
      'Título principal: {=catch({site: text; selector=h1}, "(página sem h1)")}',
    ].join('\n'),
  },
];

/** ETAPA 6 (TDD): ainda não implementado. */
export function seedExamplesOnce(): Promise<boolean> {
  return Promise.reject(new Error('seedExamplesOnce: não implementado (etapa 6)'));
}
