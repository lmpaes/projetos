// Especificação: {site: tipo; selector=...; multiple=yes|no}
import { describe, expect, it } from 'vitest';
import { renderWith, textWith } from '../../helpers/context';

const PAGE = [
  '<h1>Pedido 98765</h1>',
  '<div class="cliente"><span class="nome">Maria Silva</span></div>',
  '<ul><li>a</li><li>b</li><li>c</li></ul>',
  '<p class="espacos">   com espaços   </p>',
].join('');

describe('{site} — partes da URL (tabela do CLAUDE.md)', () => {
  // Página: https://test.com/my/page?foo=1#part
  it.each([
    ['url', 'https://test.com/my/page?foo=1#part'],
    ['domain', 'test.com'],
    ['path', '/my/page'],
    ['protocol', 'https'],
    ['query', '?foo=1'],
    ['hash', '#part'],
  ])('{site: %s} → %s', async (type, expected) => {
    expect(await renderWith(`{site: ${type}}`)).toEqual({ text: expected, errors: [] });
  });

  it('query e hash vazios quando a URL não tem', async () => {
    expect(await textWith('[{site: query}][{site: hash}]', { url: 'https://test.com/' })).toBe('[][]');
  });

  it('URL inválida dá erro claro nas partes que precisam dela', async () => {
    expect(await textWith('{site: domain}', { url: 'não é url' })).toContain(
      '[ERRO: {site}: não foi possível ler a URL da página',
    );
  });
});

describe('{site} — conteúdo da página', () => {
  it('title', async () => {
    expect(await textWith('{site: title}', { title: 'Meu CRM' })).toBe('Meu CRM');
  });

  it('selection sem espaços e quebras de linha nas pontas (o clique triplo pega o "\\n")', async () => {
    expect(await textWith('«{site: selection}»', { selection: '  Pizza Toppings\n' })).toBe('«Pizza Toppings»');
  });

  it('selection', async () => {
    expect(await textWith('«{site: selection}»', { selection: 'texto marcado' })).toBe('«texto marcado»');
  });

  it('text da página inteira', async () => {
    const text = await textWith('{site: text}', { body: PAGE });
    expect(text).toContain('Pedido 98765');
    expect(text).toContain('Maria Silva');
  });

  it('html da página inteira', async () => {
    const html = await textWith('{site: html}', { body: PAGE });
    expect(html.startsWith('<html')).toBe(true);
    expect(html).toContain('<h1>Pedido 98765</h1>');
  });
});

describe('{site} — selector e multiple', () => {
  it('texto do elemento pelo seletor CSS', async () => {
    expect(await textWith('{site: text; selector=h1}', { body: PAGE })).toBe('Pedido 98765');
  });

  it('seletor com espaço (exemplo do CLAUDE.md)', async () => {
    expect(await textWith('{site: text; selector=.cliente .nome}', { body: PAGE })).toBe('Maria Silva');
  });

  it('html do elemento', async () => {
    expect(await textWith('{site: html; selector=.nome}', { body: PAGE })).toBe(
      '<span class="nome">Maria Silva</span>',
    );
  });

  it('apara os espaços do texto', async () => {
    expect(await textWith('[{site: text; selector=.espacos}]', { body: PAGE })).toBe('[com espaços]');
  });

  it('sem multiple, pega só o primeiro', async () => {
    expect(await textWith('{site: text; selector=li}', { body: PAGE })).toBe('a');
    expect(await textWith('{site: text; selector=li; multiple=no}', { body: PAGE })).toBe('a');
  });

  it('multiple=yes devolve todos (lista)', async () => {
    expect(await textWith('{site: text; selector=li; multiple=yes}', { body: PAGE })).toBe('a, b, c');
  });

  it('multiple=yes com html', async () => {
    expect(await textWith('{site: html; selector=li; multiple=yes}', { body: PAGE })).toBe(
      '<li>a</li>, <li>b</li>, <li>c</li>',
    );
  });

  it('multiple=yes sem nenhum elemento devolve vazio (sem erro)', async () => {
    expect(await renderWith('[{site: text; selector=.nada; multiple=yes}]', { body: PAGE })).toEqual({
      text: '[]',
      errors: [],
    });
  });

  it('seletor sem elemento é erro, com dica de usar catch()', async () => {
    const result = await renderWith('Cliente: {site: text; selector=.inexistente}', { body: PAGE });
    expect(result.text).toContain('Cliente: [ERRO: {site}: nenhum elemento encontrado para o seletor ".inexistente"');
    expect(result.text).toContain('catch()');
    expect(result.errors).toEqual([expect.objectContaining({ kind: 'runtime' })]);
  });

  it('seletor CSS inválido é erro claro', async () => {
    expect(await textWith('{site: text; selector=a..b}', { body: PAGE })).toContain(
      '[ERRO: {site}: seletor CSS inválido: "a..b"]',
    );
  });
});

describe('{site} — exemplos práticos do CLAUDE.md', () => {
  it('parâmetro da query string', async () => {
    const url = 'https://meucrm.com/pedidos?id=123&tab=x';
    expect(await textWith('{=extractregex({site: query}, "id=([^&]+)")}', { url })).toBe('123');
  });

  it('último segmento do path', async () => {
    const url = 'https://loja.com/pedidos/98765';
    expect(await textWith('{=extractregex({site: path}, "/([^/]+)$")}', { url })).toBe('98765');
  });

  it('texto pelo seletor, com fallback (elemento existe)', async () => {
    expect(
      await textWith('{=catch({site: text; selector=.cliente .nome}, "Não encontrado")}', { body: PAGE }),
    ).toBe('Maria Silva');
  });

  it('texto pelo seletor, com fallback (elemento não existe)', async () => {
    expect(
      await renderWith('{=catch({site: text; selector=.cliente .nome}, "Não encontrado")}', { body: '' }),
    ).toEqual({ text: 'Não encontrado', errors: [] });
  });
});

describe('{site} — erros de escrita (sintaxe)', () => {
  it('diferencia maiúsculas: {site: URL}', async () => {
    const result = await renderWith('{site: URL}');
    expect(result.text).toContain("'URL'");
    expect(result.errors).toEqual([expect.objectContaining({ kind: 'syntax' })]);
  });

  it('selector= só vale com text/html', async () => {
    expect(await textWith('{site: url; selector=h1}')).toContain('só valem com {site: text} ou {site: html}');
  });

  it('multiple= precisa de selector=', async () => {
    expect(await textWith('{site: text; multiple=yes}')).toContain('multiple= só funciona junto com selector=');
  });
});
