// Especificação: o parser nunca quebra. Ele registra o erro com posição e
// continua lendo o resto do snippet.
import { describe, expect, it } from 'vitest';
import type { ErrorNode, Node } from '@/engine/parser';
import { cmd, errorNode, parse, stripSpans, text } from '../../helpers/ast';

const isError = (node: Node): node is ErrorNode => node.type === 'error';

describe('recuperação de erros', () => {
  it('um erro não impede o resto do snippet', () => {
    const result = parse('Olá {site: URL} mundo {clipboard}');
    expect(stripSpans(result.nodes)).toEqual([
      text('Olá '),
      errorNode("'URL'"),
      text(' mundo '),
      cmd('clipboard'),
    ]);
    expect(result.errors).toHaveLength(1);
  });

  it('coleta vários erros na ordem do texto', () => {
    const { errors } = parse('{foo} e {bar}');
    expect(errors.map((error) => error.message)).toEqual([
      expect.stringContaining('{foo}'),
      expect.stringContaining('{bar}'),
    ]);
  });

  it('errors[] tem exatamente os erros dos ErrorNodes', () => {
    const { nodes, errors } = parse('a {foo} b {site: URL}');
    expect(errors).toEqual(nodes.filter(isError).map((node) => node.error));
  });

  it('pula "{}" aninhadas dentro do comando com erro', () => {
    expect(stripSpans(parse('x {site: text; selector={a}} depois').nodes)).toEqual([
      text('x '),
      errorNode(String.raw`\{`),
      text(' depois'),
    ]);
  });

  it('respeita "}" dentro de strings ao pular o comando com erro', () => {
    expect(stripSpans(parse('{=foo("a}b")} depois').nodes)).toEqual([
      errorNode('Função desconhecida'),
      text(' depois'),
    ]);
  });
});

describe('comando não fechado', () => {
  it('consome até o fim e aponta para a "{"', () => {
    const result = parse('Olá {site: url');
    expect(stripSpans(result.nodes)).toEqual([text('Olá '), errorNode('Faltou fechar')]);
    expect(result.nodes[1]?.span).toEqual({ start: 4, end: 14 });
    expect(result.errors[0]).toMatchObject({ line: 1, column: 5 });
  });

  it('também vale para fórmulas', () => {
    expect(stripSpans(parse('{=extractregex("a", "b")').nodes)).toEqual([
      errorNode('Faltou fechar'),
    ]);
  });
});

describe('posição dos erros', () => {
  it('o ErrorNode cobre o comando inteiro', () => {
    const { nodes } = parse('ab{foo}cd');
    expect(nodes[1]).toMatchObject({ type: 'error', span: { start: 2, end: 7 } });
  });

  it('comando desconhecido aponta para o nome', () => {
    const { errors } = parse('{foo}');
    expect(errors[0]).toMatchObject({ span: { start: 1, end: 4 }, line: 1, column: 2 });
  });

  it('valor inválido aponta para o valor, com linha e coluna', () => {
    const { errors } = parse('linha 1\n  {site: URL}');
    expect(errors[0]).toMatchObject({ span: { start: 17, end: 20 }, line: 2, column: 10 });
  });
});

describe('robustez', () => {
  const malformed = [
    '{',
    '}',
    '{=',
    '{="',
    '{=(',
    '{=a(',
    '{=a(,',
    '{=")',
    '{=\\',
    '{site:',
    '{site: text;',
    '{site: text; selector=',
    '{site: text; selector="',
    '{site: text; selector=[',
    '{{{',
    '}}}',
    '\\',
    '{=catch({site:',
    '{if: ',
    '{endif}{endif}',
    '{if: x}{else}{else}',
    '{a=',
    '{a=b=c}',
  ];

  it.each(malformed)('nunca lança exceção: %j', (source) => {
    expect(() => parse(source)).not.toThrow();
  });

  it.each([...malformed, 'Olá {site: url} e {=catch({clipboard}, "x")}', 'a{if: x}b{endif}c'])(
    'os nós cobrem o texto inteiro, sem buracos: %j',
    (source) => {
      const { nodes } = parse(source);
      let expectedStart = 0;
      for (const node of nodes) {
        expect(node.span.start).toBe(expectedStart);
        expectedStart = node.span.end;
      }
      expect(expectedStart).toBe(source.length);
    },
  );
});
