// Especificação: comandos de bloco. Nenhum comando da Fase 1 é bloco; aqui
// usamos o {if} FICTÍCIO do registro de teste para provar que o parser já
// sabe montar blocos ({if}/{repeat} da Fase 2 não vão exigir reescrita).
import { describe, expect, it } from 'vitest';
import {
  block,
  call,
  cmd,
  errorNode,
  exprArg,
  parse,
  parseOk,
  raw,
  section,
  str,
  stripSpans,
  text,
  variable,
} from '../../helpers/ast';

const ifHead = (condition: unknown) => cmd('if', exprArg(condition));

describe('montagem de blocos', () => {
  it('{if: x}sim{endif}', () => {
    expect(parseOk('{if: x}sim{endif}')).toEqual([
      block('if', section(ifHead(variable('x')), text('sim'))),
    ]);
  });

  it('seções if / elseif / else', () => {
    expect(parseOk('{if: a}A{elseif: b}B{else}C{endif}')).toEqual([
      block(
        'if',
        section(ifHead(variable('a')), text('A')),
        section(cmd('elseif', exprArg(variable('b'))), text('B')),
        section(cmd('else'), text('C')),
      ),
    ]);
  });

  it('blocos aninhados', () => {
    expect(parseOk('{if: a}{if: b}x{endif}{endif}')).toEqual([
      block('if', section(ifHead(variable('a')), block('if', section(ifHead(variable('b')), text('x'))))),
    ]);
  });

  it('comandos dentro do corpo', () => {
    expect(parseOk('{if: a}Oi {clipboard}!{endif}')).toEqual([
      block('if', section(ifHead(variable('a')), text('Oi '), cmd('clipboard'), text('!'))),
    ]);
  });

  it('texto antes e depois do bloco', () => {
    expect(parseOk('a{if: x}b{endif}c')).toEqual([
      text('a'),
      block('if', section(ifHead(variable('x')), text('b'))),
      text('c'),
    ]);
  });

  it('o span do bloco vai da abertura até o fechamento', () => {
    expect(parse('a{if: x}b{endif}c').nodes[1]?.span).toEqual({ start: 1, end: 16 });
  });

  it('argumento do tipo expressão aceita chamada e comando embutido', () => {
    expect(parseOk('{if: extractregex({site: url}, "a")}x{endif}')).toEqual([
      block(
        'if',
        section(ifHead(call('extractregex', cmd('site', raw('url')), str('a'))), text('x')),
      ),
    ]);
  });
});

describe('erros de bloco', () => {
  it('{endif} sem {if}', () => {
    const { nodes, errors } = parse('{endif}');
    expect(stripSpans(nodes)).toEqual([errorNode('{endif}')]);
    expect(errors[0]?.message).toContain('{if}');
  });

  it('{else} sem {if} não afeta o texto em volta', () => {
    expect(stripSpans(parse('a{else}b').nodes)).toEqual([text('a'), errorNode('{else}'), text('b')]);
  });

  it('{if} não fechado: erro na abertura e o conteúdo segue como texto', () => {
    const { nodes, errors } = parse('{if: x}abc');
    expect(stripSpans(nodes)).toEqual([errorNode('{endif}'), text('abc')]);
    expect(errors).toHaveLength(1);
  });
});
