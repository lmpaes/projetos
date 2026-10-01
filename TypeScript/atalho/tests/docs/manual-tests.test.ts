// Garante que o roteiro de testes manuais (TESTES_MANUAIS.md) e o arquivo de
// snippets que ele manda importar (snippets-de-teste.json) estão certos:
// o arquivo importa sem erro, os atalhos não brigam entre si e cada snippet
// gera exatamente o "resultado esperado" escrito no roteiro.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';
import type { Snippet } from '@/shared/types';
import { parseBackup, type ImportedSnippet } from '@/storage/backup';
import { EXAMPLE_SNIPPETS } from '@/storage/examples';
import { validateSnippet } from '@/storage/validation';
import { renderWith, type ContextOptions } from '../helpers/context';

// Os testes rodam a partir da pasta do projeto (TypeScript/atalho).
const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');
const MANUAL = read('TESTES_MANUAIS.md');
const parsed = parseBackup(read('snippets-de-teste.json'));
const snippets: ImportedSnippet[] = parsed.ok ? parsed.snippets : [];

function contentOf(shortcut: string): string {
  const found = snippets.find((item) => item.shortcut === shortcut);
  if (!found) throw new Error(`snippet ${shortcut} não está no snippets-de-teste.json`);
  return found.content;
}

/** Página parecida com https://httpbin.org/forms/post (sem <title>). */
const HTTPBIN: ContextOptions = {
  url: 'https://httpbin.org/forms/post?id=123&tab=x#detalhes',
  title: '',
  body: `<form method="post" action="/post">
    <p><label>Customer name: <input name="custname"></label></p>
    <fieldset><legend> Pizza Size </legend></fieldset>
    <fieldset><legend> Pizza Toppings </legend></fieldset>
    <p><label>Delivery instructions: <textarea name="comments"></textarea></label></p>
  </form>`,
  clipboard: () => Promise.resolve('texto copiado'),
};

/** Página parecida com https://the-internet.herokuapp.com/login. */
const LOGIN_PAGE: ContextOptions = {
  url: 'https://the-internet.herokuapp.com/login',
  title: 'The Internet',
  body: `<div class="example"><h2>Login Page</h2>
    <form id="login"><input type="text" id="username"><input type="password" id="password"></form></div>`,
};

describe('snippets-de-teste.json', () => {
  it('é um backup válido do Atalho', () => {
    expect(parsed).toMatchObject({ ok: true });
    expect(snippets.length).toBeGreaterThan(0);
  });

  it('nenhum atalho dá erro ou aviso (nem com os exemplos e o /atd do Zendesk)', () => {
    const others: Snippet[] = [
      ...EXAMPLE_SNIPPETS,
      { name: 'Zendesk', shortcut: '/atd', content: 'x' },
      ...snippets,
    ].map((item, index) => ({ ...item, id: `id-${index}`, createdAt: 0, updatedAt: 0 }));

    for (const [index, item] of snippets.entries()) {
      const editingId = `id-${index + EXAMPLE_SNIPPETS.length + 1}`;
      expect(validateSnippet(item, others, editingId), item.shortcut).toEqual({ errors: [], warnings: [] });
    }
  });

  it('todo atalho aparece no TESTES_MANUAIS.md', () => {
    for (const { shortcut } of snippets) expect(MANUAL, shortcut).toContain(shortcut);
  });
});

describe('resultados esperados do roteiro', () => {
  it.each([
    [
      '/t-partes',
      [
        'url: https://httpbin.org/forms/post?id=123&tab=x#detalhes',
        'domain: httpbin.org',
        'path: /forms/post',
        'protocol: https',
        'query: ?id=123&tab=x',
        'hash: #detalhes',
        'title: ',
      ].join('\n'),
    ],
    ['/t-seletor', 'Pizza Size'],
    ['/t-lista', 'Pizza Size, Pizza Toppings'],
    ['/t-id', 'ID: 123'],
    ['/t-var', 'Pedido nº 123 em httpbin.org'],
    ['/t-catch', 'Vendedor: Não encontrado'],
    ['/t-hora', '01/10/2026 às 14:30 (quinta-feira)'],
    ['/t-clip', 'Copiado: texto copiado'],
    ['/t-nome', 'Maria Silva'],
    ['/t-linhas', 'Olá!\nEsta é a linha 2.\nData: 01/10/2026'],
  ])('%s no httpbin', async (shortcut, expected) => {
    const result = await renderWith(contentOf(shortcut), HTTPBIN);
    expect(result).toEqual({ text: expected, errors: [] });
  });

  it('/t-erro: erro no meio, o resto do texto continua', async () => {
    const { text, errors } = await renderWith(contentOf('/t-erro'), HTTPBIN);
    expect(text).toBe(
      'Antes [ERRO: {site}: nenhum elemento encontrado para o seletor ".nao-existe" ' +
        '(use catch() para definir um texto padrão)] depois',
    );
    expect(errors).toHaveLength(1);
  });

  it('/t-selecao usa o texto selecionado na página', async () => {
    const result = await renderWith(contentOf('/t-selecao'), { ...HTTPBIN, selection: 'Pizza Toppings' });
    expect(result).toEqual({ text: 'Selecionado: Pizza Toppings', errors: [] });
  });

  it('/t-pagina no the-internet', async () => {
    const result = await renderWith(contentOf('/t-pagina'), LOGIN_PAGE);
    expect(result).toEqual({ text: 'The Internet | Login Page', errors: [] });
  });

  it('o texto do erro do /t-erro está igual no roteiro', () => {
    expect(MANUAL).toContain('nenhum elemento encontrado para o seletor ".nao-existe"');
  });
});
