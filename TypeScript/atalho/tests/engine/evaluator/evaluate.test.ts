// Especificação do avaliador: executa a AST e monta o texto final.
import { beforeEach, describe, expect, it } from 'vitest';
import { callLog, render, renderText } from '../../fixtures/engine';

beforeEach(() => {
  callLog.length = 0;
});

describe('texto e fórmulas simples', () => {
  it('texto puro passa intacto', async () => {
    expect(await render('Olá, mundo!')).toEqual({ text: 'Olá, mundo!', errors: [] });
  });

  it('string vazia', async () => {
    expect(await render('')).toEqual({ text: '', errors: [] });
  });

  it('escapes já resolvidos pelo parser', async () => {
    expect(await renderText(String.raw`Use \{chaves\}`)).toBe('Use {chaves}');
  });

  it('fórmula com string', async () => {
    expect(await renderText('A {="b"} C')).toBe('A b C');
  });

  it('comando no texto', async () => {
    expect(await renderText('Oi {echo: Leo}!')).toBe('Oi Leo!');
  });

  it('comando embutido numa fórmula', async () => {
    expect(await renderText('{=catch({echo: ok}, "x")}')).toBe('ok');
  });

  it('lista vira itens separados por vírgula', async () => {
    expect(await renderText('{list: a,b,c}')).toBe('a, b, c');
  });

  it('espera comandos assíncronos', async () => {
    expect(await renderText('Isso é {slow}.')).toBe('Isso é lento.');
  });

  it('executa os comandos em ordem, um de cada vez', async () => {
    await render('{echo: 1}{slow}{echo: 2}');
    expect(callLog).toEqual(['echo:1', 'slow', 'echo:2']);
  });
});

describe('variáveis', () => {
  it('atribuição não insere nada; uso insere o valor', async () => {
    expect(await renderText('{id="42"}Pedido {=id}')).toBe('Pedido 42');
  });

  it('atribuição com comando', async () => {
    expect(await renderText('{nome={echo: Leo}}Olá, {=nome}')).toBe('Olá, Leo');
  });

  it('a última atribuição vale', async () => {
    expect(await renderText('{x="a"}{x="b"}{=x}')).toBe('b');
  });

  it('nomes com acento', async () => {
    expect(await renderText('{preço="10"}R$ {=preço}')).toBe('R$ 10');
  });

  it('variável não definida vira erro no texto, apontando para ela', async () => {
    const result = await render('Oi {=nome}!');
    expect(result.text).toMatch(/^Oi \[ERRO: .*\]!$/);
    expect(result.text).toContain("variável 'nome' não foi definida");
    expect(result.errors).toEqual([
      expect.objectContaining({
        kind: 'runtime',
        span: { start: 5, end: 9 },
        line: 1,
        column: 6,
      }),
    ]);
  });

  it('usar antes de atribuir é erro (ordem importa)', async () => {
    const result = await render('{=x}{x="a"}');
    expect(result.errors).toHaveLength(1);
    expect(result.text).toContain("variável 'x' não foi definida");
  });
});

describe('erros não quebram o snippet', () => {
  it('erro de comando vira "[ERRO: {comando}: mensagem]" e o resto aparece', async () => {
    const result = await render('Olá {fail: ops} mundo');
    expect(result.text).toBe('Olá [ERRO: {fail}: ops] mundo');
    expect(result.errors).toEqual([
      { kind: 'runtime', message: '{fail}: ops', span: { start: 4, end: 15 }, line: 1, column: 5 },
    ]);
  });

  it('erro de sintaxe também vira "[ERRO: ...]"', async () => {
    const result = await render('a {foo} b');
    expect(result.text).toMatch(/^a \[ERRO: Comando desconhecido: \{foo\}.*\] b$/);
    expect(result.errors).toEqual([expect.objectContaining({ kind: 'syntax', line: 1, column: 4 })]);
  });

  it('vários erros, na ordem do texto', async () => {
    const result = await render('{fail: um} {foo} {=x}');
    expect(result.errors.map((error) => error.kind)).toEqual(['runtime', 'syntax', 'runtime']);
  });

  it('bug dentro de um comando vira "erro inesperado" em vez de travar tudo', async () => {
    const result = await render('a {boom} b');
    expect(result.text).toBe('a [ERRO: {boom}: erro inesperado: x is not a function] b');
  });

  it('erro dentro de comando embutido mostra o nome do comando', async () => {
    expect(await renderText('{=extractregex({fail: sem dados}, "x")}')).toBe(
      '[ERRO: {fail}: sem dados]',
    );
  });

  it('atribuição que falha não mostra nada até a variável ser usada', async () => {
    const result = await render('{id={fail: ops}}Pedido {=id}');
    expect(result.text).toBe('Pedido [ERRO: {fail}: ops]');
    expect(result.errors).toHaveLength(1);
  });

  it('nunca rejeita, mesmo com snippets malformados', async () => {
    for (const source of ['{', '{=', '{="', '{site:', '{=catch(', '{endif}', '{a=b=c}', '\\']) {
      await expect(render(source)).resolves.toBeDefined();
    }
  });
});
