// Especificação: texto puro, escapes e quando uma "{" abre (ou não) um comando.
import { describe, expect, it } from 'vitest';
import { cmd, parse, parseOk, text } from '../../helpers/ast';

describe('texto puro', () => {
  it('string vazia não gera nós nem erros', () => {
    expect(parse('')).toEqual({ nodes: [], errors: [] });
  });

  it('texto sem comandos vira um único TextNode', () => {
    expect(parseOk('Olá, mundo!')).toEqual([text('Olá, mundo!')]);
  });

  it('preserva quebras de linha e espaços', () => {
    expect(parseOk('Att,\n  Leo\n')).toEqual([text('Att,\n  Leo\n')]);
  });

  it('texto antes, entre e depois de comandos', () => {
    expect(parseOk('Olá {clipboard}, tchau')).toEqual([
      text('Olá '),
      cmd('clipboard'),
      text(', tchau'),
    ]);
  });
});

describe('escapes com barra invertida', () => {
  it('\\{ e \\} viram chaves literais', () => {
    expect(parseOk(String.raw`Use \{chaves\}`)).toEqual([text('Use {chaves}')]);
  });

  it('\\\\ vira uma única barra', () => {
    expect(parseOk(String.raw`a\\b`)).toEqual([text(String.raw`a\b`)]);
  });

  it('outros \\x ficam como estão (caminhos do Windows funcionam)', () => {
    expect(parseOk(String.raw`C:\Users\Leo`)).toEqual([text(String.raw`C:\Users\Leo`)]);
  });

  it('barra no fim do texto fica literal', () => {
    expect(parseOk('fim\\')).toEqual([text('fim\\')]);
  });

  it('\\\\ antes de um comando escapa a barra, não a chave', () => {
    expect(parseOk(String.raw`a\\{clipboard}`)).toEqual([text('a\\'), cmd('clipboard')]);
  });

  it('escapes colados em comandos', () => {
    expect(parseOk(String.raw`\{{clipboard}\}`)).toEqual([
      text('{'),
      cmd('clipboard'),
      text('}'),
    ]);
  });
});

describe('chaves que NÃO abrem comando são texto literal', () => {
  // Regra: "{" só abre comando quando vem COLADA em "=" ou num nome.
  // Assim JSON e código colados num snippet não quebram.
  it.each([
    ['"}" solto', 'a } b'],
    ['JSON', '{"a": 1}'],
    ['chaves vazias', '{}'],
    ['chaves com espaço', '{ }'],
    ['espaço logo após "{"', '{ clipboard}'],
    ['código com bloco', 'if (x) { return y; }'],
    ['código com quebra de linha', 'function f() {\n  return 1;\n}'],
    ['"{" seguido de número', 'x {1}'],
  ])('%s', (_label, source) => {
    expect(parseOk(source)).toEqual([text(source)]);
  });
});

describe('posições (spans)', () => {
  it('cada nó registra o trecho do texto original', () => {
    const { nodes } = parse('ab{clipboard}cd');
    expect(nodes.map((node) => node.span)).toEqual([
      { start: 0, end: 2 },
      { start: 2, end: 13 },
      { start: 13, end: 15 },
    ]);
  });

  it('o span do texto cobre os escapes como estão no original', () => {
    const { nodes } = parse(String.raw`\{x`);
    expect(nodes[0]?.span).toEqual({ start: 0, end: 3 });
  });
});
