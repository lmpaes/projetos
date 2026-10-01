// Especificação: encontrar o atalho que acabou de ser digitado.
import { describe, expect, it } from 'vitest';
import { createMatcher } from '@/content/matcher';
import { snippet } from '../storage/fixtures';

const matcher = createMatcher([
  snippet({ shortcut: '/sig' }),
  snippet({ shortcut: 'ig' }),
  snippet({ shortcut: '/end' }),
]);

describe('createMatcher', () => {
  it('acha o atalho no fim do texto', () => {
    expect(matcher.match('Olá /end')?.shortcut).toBe('/end');
  });

  it('o atalho mais longo vence ("/sig" e não "ig")', () => {
    expect(matcher.match('Olá /sig')?.shortcut).toBe('/sig');
    expect(matcher.match('big')?.shortcut).toBe('ig');
  });

  it('atalho incompleto ou no meio do texto não conta', () => {
    expect(matcher.match('/si')).toBeNull();
    expect(matcher.match('/sig ')).toBeNull();
    expect(matcher.match('')).toBeNull();
  });

  it('diferencia maiúsculas de minúsculas', () => {
    expect(matcher.match('/SIG')).toBeNull();
  });

  it('maxLength é o tamanho do maior atalho', () => {
    expect(matcher.maxLength).toBe(4);
  });

  it('couldEndWith filtra pela última letra dos atalhos', () => {
    expect(matcher.couldEndWith('g')).toBe(true);
    expect(matcher.couldEndWith('d')).toBe(true);
    expect(matcher.couldEndWith('x')).toBe(false);
  });

  it('sem snippets, nada casa', () => {
    const empty = createMatcher([]);
    expect(empty.maxLength).toBe(0);
    expect(empty.couldEndWith('a')).toBe(false);
    expect(empty.match('qualquer coisa')).toBeNull();
  });
});
