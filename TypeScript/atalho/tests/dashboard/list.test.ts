// Especificação: ordenação, busca e "alterações não salvas".
import { describe, expect, it } from 'vitest';
import { draftFrom, EMPTY_DRAFT, filterSnippets, isDirty, sortSnippets } from '@/dashboard/list';
import { snippet } from '../storage/fixtures';

const items = [
  snippet({ name: 'Zebra', shortcut: '/z' }),
  snippet({ name: 'água', shortcut: '/agua', content: 'Beba água' }),
  snippet({ name: 'Assinatura', shortcut: '/sig', content: 'Att, Leo' }),
  snippet({ name: 'Olá', shortcut: '/ola', content: 'Olá, tudo bem?' }),
];

describe('sortSnippets', () => {
  it('ordena por nome, em ordem de dicionário (acentos e maiúsculas não atrapalham)', () => {
    expect(sortSnippets(items).map((s) => s.name)).toEqual(['água', 'Assinatura', 'Olá', 'Zebra']);
  });

  it('não altera a lista original', () => {
    const copy = [...items];
    sortSnippets(items);
    expect(items).toEqual(copy);
  });
});

describe('filterSnippets', () => {
  const names = (query: string) => filterSnippets(items, query).map((s) => s.name);

  it('busca vazia devolve todos', () => {
    expect(names('  ')).toHaveLength(4);
  });

  it('busca pelo nome, sem ligar para acentos e maiúsculas', () => {
    expect(names('OLA')).toEqual(['Olá']);
    expect(names('agua')).toEqual(['água']);
  });

  it('busca pelo atalho e pelo conteúdo', () => {
    expect(names('/sig')).toEqual(['Assinatura']);
    expect(names('leo')).toEqual(['Assinatura']);
  });

  it('sem resultados', () => {
    expect(names('xyz')).toEqual([]);
  });
});

describe('rascunho', () => {
  it('draftFrom copia os campos editáveis (ou vazio para snippet novo)', () => {
    expect(draftFrom(items[2] ?? null)).toEqual({ name: 'Assinatura', shortcut: '/sig', content: 'Att, Leo' });
    expect(draftFrom(null)).toEqual(EMPTY_DRAFT);
  });

  it('isDirty compara os três campos', () => {
    const base = { name: 'a', shortcut: '/a', content: 'x' };
    expect(isDirty(base, { ...base })).toBe(false);
    expect(isDirty({ ...base, content: 'y' }, base)).toBe(true);
    expect(isDirty({ ...base, name: 'b' }, base)).toBe(true);
  });
});
