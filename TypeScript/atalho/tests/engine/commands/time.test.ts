// Especificação: {time: formato} — formatos do dayjs, em português (pt-br).
import { describe, expect, it } from 'vitest';
import { renderWith, textWith } from '../../helpers/context';

// Relógio parado: quinta-feira, 01/10/2026 às 14:30:05.
const now = new Date(2026, 9, 1, 14, 30, 5);

describe('{time}', () => {
  it.each([
    ['DD/MM/YYYY', '01/10/2026'],
    ['HH:mm', '14:30'],
    ['HH:mm:ss', '14:30:05'],
    ['dddd', 'quinta-feira'],
    ['MMMM', 'outubro'],
    ['[Hoje é] dddd', 'Hoje é quinta-feira'],
    ['DD/MM/YYYY [às] HH:mm', '01/10/2026 às 14:30'],
    ['LL', '1 de outubro de 2026'],
  ])('{time: %s} → %s', async (format, expected) => {
    expect(await renderWith(`{time: ${format}}`, { now })).toEqual({ text: expected, errors: [] });
  });

  it('usa o relógio do contexto (não o relógio real)', async () => {
    expect(await textWith('{time: YYYY}', { now: new Date(1999, 0, 1) })).toBe('1999');
  });

  it('funciona dentro de fórmulas', async () => {
    expect(await textWith('{=extractregex({time: DD/MM/YYYY}, "/(\\d+)/")}', { now })).toBe('10');
  });

  it('formato é obrigatório', async () => {
    const result = await renderWith('{time}', { now });
    expect(result.text).toContain('precisa de um argumento');
    expect(result.errors).toEqual([expect.objectContaining({ kind: 'syntax' })]);
  });
});
