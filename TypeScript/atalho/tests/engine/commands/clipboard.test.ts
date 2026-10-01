// Especificação: {clipboard}
import { describe, expect, it } from 'vitest';
import { renderWith, textWith } from '../../helpers/context';

const copied = (text: string) => () => Promise.resolve(text);
const blocked = () => Promise.reject(new Error('acesso negado'));

describe('{clipboard}', () => {
  it('insere o texto da área de transferência', async () => {
    expect(await renderWith('Colado: {clipboard}.', { clipboard: copied('olá') })).toEqual({
      text: 'Colado: olá.',
      errors: [],
    });
  });

  it('funciona dentro de fórmulas', async () => {
    expect(
      await textWith(String.raw`{=extractregex({clipboard}, "\d+")}`, { clipboard: copied('Pedido #4521') }),
    ).toBe('4521');
  });

  it('falha na leitura vira erro claro', async () => {
    const result = await renderWith('{clipboard}', { clipboard: blocked });
    expect(result.text).toBe(
      '[ERRO: {clipboard}: não foi possível ler a área de transferência (acesso negado)]',
    );
    expect(result.errors).toEqual([expect.objectContaining({ kind: 'runtime' })]);
  });

  it('catch() trata a falha', async () => {
    expect(await textWith('{=catch({clipboard}, "(vazio)")}', { clipboard: blocked })).toBe('(vazio)');
  });

  it('não aceita argumento', async () => {
    expect(await textWith('{clipboard: x}')).toContain('não aceita argumento');
  });
});
