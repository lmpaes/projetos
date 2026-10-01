import { storage } from 'wxt/utils/storage';
import type { SnippetInput } from '@/shared/types';
import { createSnippet, listSnippets } from './snippets';

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

/** Marca que os exemplos já foram oferecidos (para não voltarem se forem apagados). */
const examplesSeededItem = storage.defineItem<boolean>('local:examplesSeeded', { fallback: false });

/**
 * Cadastra os exemplos UMA vez, e só se a lista estiver vazia.
 * Devolve true se cadastrou.
 */
export async function seedExamplesOnce(): Promise<boolean> {
  if (await examplesSeededItem.getValue()) return false;
  await examplesSeededItem.setValue(true); // marca antes, para não duplicar em chamadas simultâneas
  if ((await listSnippets()).length > 0) return false;
  for (const example of EXAMPLE_SNIPPETS) await createSnippet(example);
  return true;
}
