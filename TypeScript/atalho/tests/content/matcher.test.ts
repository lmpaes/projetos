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
    expect(matcher.match('Olá ig')?.shortcut).toBe('ig');
  });

  it('atalho incompleto ou no meio do texto não conta', () => {
    expect(matcher.match('/si')).toBeNull();
    expect(matcher.match('/sig ')).toBeNull();
    expect(matcher.match('')).toBeNull();
  });

  it('atalho colado em outra palavra não conta (precisa de separador antes)', () => {
    expect(matcher.match('a/sig')).toBeNull();
    expect(matcher.match('site.com/end')).toBeNull();
    expect(matcher.match('big')).toBeNull();
    expect(matcher.match('(/sig')?.shortcut).toBe('/sig');
    expect(matcher.match('Olá\n/end')?.shortcut).toBe('/end');
  });

  it('se o mais longo está colado, um mais curto que respeita o separador ainda vale', () => {
    const withPunctuation = createMatcher([snippet({ shortcut: 'a-c' }), snippet({ shortcut: 'c' })]);
    // "a-c" está colado no "x"; o "c" vem depois de "-", que é separador.
    expect(withPunctuation.match('xa-c')?.shortcut).toBe('c');
    expect(withPunctuation.match('x a-c')?.shortcut).toBe('a-c');
  });

  it('diferencia maiúsculas de minúsculas', () => {
    expect(matcher.match('/SIG')).toBeNull();
  });

  it('contextLength é o maior atalho + 1 (o caractere de antes, para conferir o separador)', () => {
    expect(matcher.contextLength).toBe(5);
  });

  it('couldEndWith filtra pela última letra dos atalhos', () => {
    expect(matcher.couldEndWith('g')).toBe(true);
    expect(matcher.couldEndWith('d')).toBe(true);
    expect(matcher.couldEndWith('x')).toBe(false);
  });

  it('sem snippets, nada casa', () => {
    const empty = createMatcher([]);
    expect(empty.contextLength).toBe(0);
    expect(empty.couldEndWith('a')).toBe(false);
    expect(empty.match('qualquer coisa')).toBeNull();
  });
});
