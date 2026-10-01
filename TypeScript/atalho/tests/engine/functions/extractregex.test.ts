// Especificação: extractregex(texto, regex)
import { describe, expect, it } from 'vitest';
import { render, renderText } from '../../fixtures/engine';

describe('extractregex', () => {
  it('pega um parâmetro da query string (1º grupo de captura)', async () => {
    expect(await renderText('{=extractregex("?id=123&tab=x", "id=([^&]+)")}')).toBe('123');
  });

  it('pega o último segmento do path', async () => {
    expect(await renderText('{=extractregex("/pedidos/98765", "/([^/]+)$")}')).toBe('98765');
  });

  it('sem grupo de captura, devolve o trecho inteiro encontrado', async () => {
    expect(await renderText('{=extractregex("pedido 4521 ok", "[0-9]+")}')).toBe('4521');
  });

  it('com vários grupos, devolve o primeiro', async () => {
    expect(await renderText('{=extractregex("2026-10-01", "(\\d+)-(\\d+)")}')).toBe('2026');
  });

  it('aceita \\d sem escape duplo', async () => {
    expect(await renderText(String.raw`{=extractregex("abc 77", "\d+")}`)).toBe('77');
  });

  it('grupo opcional que não participou devolve texto vazio', async () => {
    expect(await renderText('{=extractregex("abc", "(x)?abc")}')).toBe('');
  });

  it('sem correspondência devolve texto vazio', async () => {
    expect(await render('[{=extractregex("abc", "z+")}]')).toEqual({ text: '[]', errors: [] });
  });

  it('diferencia maiúsculas de minúsculas', async () => {
    expect(await renderText('{=extractregex("ABC", "abc")}')).toBe('');
  });

  it('usa o texto de comandos e variáveis', async () => {
    expect(await renderText('{url="/a/b?id=9"}{=extractregex(url, "id=(\\d+)")}')).toBe('9');
    expect(await renderText('{=extractregex({echo: id=55}, "id=(\\d+)")}')).toBe('55');
  });

  it('lista vira texto antes de aplicar a regex', async () => {
    expect(await renderText('{=extractregex({list: a,b}, "a, (b)")}')).toBe('b');
  });

  it('regex inválida é um erro claro', async () => {
    const result = await render('{=extractregex("abc", "(")}');
    expect(result.text).toMatch(/^\[ERRO: extractregex: regex inválida/);
    expect(result.errors).toEqual([expect.objectContaining({ kind: 'runtime' })]);
  });
});
