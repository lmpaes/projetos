// Especificação: snippets de exemplo cadastrados na primeira execução.
import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { parseTemplate } from '@/engine/parser';
import { EXAMPLE_SNIPPETS, seedExamplesOnce } from '@/storage/examples';
import { createSnippet, deleteSnippet, listSnippets } from '@/storage/snippets';
import { validateSnippet } from '@/storage/validation';
import { engine, textWith } from '../helpers/context';
import { input } from './fixtures';

beforeEach(() => {
  fakeBrowser.reset();
});

describe('seedExamplesOnce', () => {
  it('com a lista vazia, cadastra os exemplos', async () => {
    expect(await seedExamplesOnce()).toBe(true);
    expect((await listSnippets()).map((s) => s.shortcut)).toEqual(['/ola', '/pag']);
  });

  it('só uma vez: não duplica ao rodar de novo', async () => {
    await seedExamplesOnce();
    expect(await seedExamplesOnce()).toBe(false);
    expect(await listSnippets()).toHaveLength(2);
  });

  it('não mexe em quem já tem snippets', async () => {
    await createSnippet(input({ shortcut: '/meu' }));
    expect(await seedExamplesOnce()).toBe(false);
    expect((await listSnippets()).map((s) => s.shortcut)).toEqual(['/meu']);
  });

  it('se o usuário apagar tudo depois, os exemplos não voltam', async () => {
    await seedExamplesOnce();
    for (const s of await listSnippets()) await deleteSnippet(s.id);
    expect(await seedExamplesOnce()).toBe(false);
    expect(await listSnippets()).toEqual([]);
  });
});

describe('EXAMPLE_SNIPPETS', () => {
  it.each(EXAMPLE_SNIPPETS.map((example) => [example.shortcut, example] as const))(
    '%s é válido e sem erro de sintaxe',
    (_shortcut, example) => {
      expect(validateSnippet(example, []).errors).toEqual([]);
      expect(parseTemplate(example.content, engine.syntax).errors).toEqual([]);
    },
  );

  it('/ola mostra a data por extenso', async () => {
    const ola = EXAMPLE_SNIPPETS[0]?.content ?? '';
    expect(await textWith(ola, { now: new Date(2026, 9, 1) })).toBe(
      'Olá! Hoje é quinta-feira, 01 de outubro de 2026.',
    );
  });

  it('/pag mostra título, URL, id da query string e o <h1>', async () => {
    const pag = EXAMPLE_SNIPPETS[1]?.content ?? '';
    const url = 'https://loja.com/pedido?id=42';
    expect(await textWith(pag, { url, title: 'Pedido 42', body: '<h1>Pedido #42</h1>' })).toBe(
      `Página: Pedido 42\nEndereço: ${url}\nID na URL: 42\nTítulo principal: Pedido #42`,
    );
  });

  it('/pag numa página sem id e sem <h1>: id vazio e o catch() entra em ação', async () => {
    const pag = EXAMPLE_SNIPPETS[1]?.content ?? '';
    expect(await textWith(pag, { url: 'https://loja.com/', body: '' })).toContain(
      'ID na URL: \nTítulo principal: (página sem h1)',
    );
  });
});
