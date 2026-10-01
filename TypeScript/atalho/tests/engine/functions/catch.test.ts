// Especificação: catch(expressão, padrão)
import { beforeEach, describe, expect, it } from 'vitest';
import { callLog, render, renderText } from '../../fixtures/engine';

beforeEach(() => {
  callLog.length = 0;
});

describe('catch', () => {
  it('sem erro, devolve o valor da expressão', async () => {
    expect(await renderText('{=catch({echo: ok}, "padrão")}')).toBe('ok');
  });

  it('com erro, devolve o padrão (e não registra erro)', async () => {
    expect(await render('{=catch({fail: ops}, "Não encontrado")}')).toEqual({
      text: 'Não encontrado',
      errors: [],
    });
  });

  it('só calcula o padrão quando precisa (argumento preguiçoso)', async () => {
    await render('{=catch({echo: ok}, {fail: nunca})}');
    expect(callLog).toEqual(['echo:ok']);
  });

  it('pega erro de variável não definida', async () => {
    expect(await renderText('{=catch(nada, "vazio")}')).toBe('vazio');
  });

  it('pega erro guardado numa variável cuja atribuição falhou', async () => {
    expect(await renderText('{id={fail: ops}}{=catch(id, "sem id")}')).toBe('sem id');
  });

  it('pega erro de extractregex', async () => {
    expect(await renderText('{=catch(extractregex("abc", "("), "regex ruim")}')).toBe('regex ruim');
  });

  it('pega até bug de comando', async () => {
    expect(await renderText('{=catch({boom}, "ok")}')).toBe('ok');
  });

  it('se o padrão também falhar, o erro aparece', async () => {
    expect(await renderText('{=catch({fail: um}, {fail: dois})}')).toBe('[ERRO: {fail}: dois]');
  });

  it('catch aninhado', async () => {
    expect(await renderText('{=catch({fail: um}, catch({fail: dois}, "três"))}')).toBe('três');
  });

  it('NÃO pega erro de sintaxe (o snippet está mal escrito, não falhou ao executar)', async () => {
    const result = await render('{=catch({foo}, "x")}');
    expect(result.text).toContain('[ERRO: Comando desconhecido');
    expect(result.errors).toEqual([expect.objectContaining({ kind: 'syntax' })]);
  });
});
