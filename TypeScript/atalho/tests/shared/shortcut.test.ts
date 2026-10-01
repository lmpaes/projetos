// Especificação: quando o texto antes do cursor "termina com o atalho" de verdade.
// Regra (decisão do Leo na Etapa 8.1): o atalho precisa estar SEPARADO do que vem
// antes. Colado em letra, número, "_" ou nas barras de URL/caminho, não conta.
import { describe, expect, it } from 'vitest';
import { endsWithShortcut } from '@/shared/shortcut';

describe('endsWithShortcut — separador antes do atalho', () => {
  it.each([
    ['início do texto', '/sig'],
    ['depois de espaço', 'Olá /sig'],
    ['depois de quebra de linha', 'Olá\n/sig'],
    ['depois de espaço não separável (&nbsp; do Gmail)', 'Olá\u00A0/sig'],
    ['depois de tab', 'a\t/sig'],
    ['depois de parêntese', '(/sig'],
    ['depois de aspas', '"/sig'],
    ['depois de dois-pontos', 'Assinatura:/sig'],
    ['depois de vírgula', 'ok,/sig'],
  ])('expande: %s', (_label, text) => {
    expect(endsWithShortcut(text, '/sig')).toBe(true);
  });

  it.each([
    ['colado numa letra', 'a/sig'],
    ['colado numa letra acentuada', 'é/sig'],
    ['colado num número', '2/sig'],
    ['colado num "_"', 'nome_/sig'],
    ['dentro de um caminho de URL', 'site.com/sig'],
    ['logo depois de "https:/"', 'https://sig'],
    ['depois de uma barra invertida', 'C:\\/sig'],
  ])('não expande: %s', (_label, text) => {
    expect(endsWithShortcut(text, '/sig')).toBe(false);
  });

  it('atalho sem símbolo também precisa de separador ("assig" não dispara "sig")', () => {
    expect(endsWithShortcut('assig', 'sig')).toBe(false);
    expect(endsWithShortcut('a sig', 'sig')).toBe(true);
  });

  it('precisa terminar com o atalho', () => {
    expect(endsWithShortcut('/si', '/sig')).toBe(false);
    expect(endsWithShortcut('/sig ', '/sig')).toBe(false);
    expect(endsWithShortcut('', '/sig')).toBe(false);
  });

  it('diferencia maiúsculas de minúsculas', () => {
    expect(endsWithShortcut('/SIG', '/sig')).toBe(false);
  });

  it('atalho vazio nunca casa', () => {
    expect(endsWithShortcut('qualquer', '')).toBe(false);
  });
});
