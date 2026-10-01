// Especificação: fórmulas {=...} e atribuições {nome=...}.
import { describe, expect, it } from 'vitest';
import {
  assign,
  call,
  cmd,
  formula,
  parseOk,
  parseOneError,
  raw,
  str,
  text,
  variable,
} from '../../helpers/ast';

describe('fórmulas {=...}', () => {
  it('string', () => {
    expect(parseOk('{="olá"}')).toEqual([formula(str('olá'))]);
  });

  it('espaços em volta da expressão', () => {
    expect(parseOk('{=  "olá"  }')).toEqual([formula(str('olá'))]);
  });

  it('\\" vira aspas e \\\\ vira uma barra', () => {
    expect(parseOk(String.raw`{="diz \"oi\" \\ fim"}`)).toEqual([
      formula(str(String.raw`diz "oi" \ fim`)),
    ]);
  });

  it('outros \\x ficam como estão (regex sem escape duplo)', () => {
    expect(parseOk(String.raw`{="\d+\.\w"}`)).toEqual([formula(str(String.raw`\d+\.\w`))]);
  });

  it('chaves dentro da string', () => {
    expect(parseOk('{="a}b{c"}')).toEqual([formula(str('a}b{c'))]);
  });

  it('string vazia', () => {
    expect(parseOk('{=""}')).toEqual([formula(str(''))]);
  });

  it('variável', () => {
    expect(parseOk('{=nome}')).toEqual([formula(variable('nome'))]);
  });

  it('variável com acento', () => {
    expect(parseOk('{=preço}')).toEqual([formula(variable('preço'))]);
  });

  it('chamada de função', () => {
    expect(parseOk('{=extractregex("abc", "b")}')).toEqual([
      formula(call('extractregex', str('abc'), str('b'))),
    ]);
  });

  it('argumentos em várias linhas', () => {
    expect(parseOk('{=extractregex(\n  "abc",\n  "b"\n)}')).toEqual([
      formula(call('extractregex', str('abc'), str('b'))),
    ]);
  });

  it('chamadas aninhadas', () => {
    expect(parseOk('{=catch(extractregex(texto, "a"), "padrão")}')).toEqual([
      formula(call('catch', call('extractregex', variable('texto'), str('a')), str('padrão'))),
    ]);
  });

  it('comando embutido: pegar o id da query string', () => {
    expect(parseOk('{=extractregex({site: query}, "id=([^&]+)")}')).toEqual([
      formula(call('extractregex', cmd('site', raw('query')), str('id=([^&]+)'))),
    ]);
  });

  it('comando embutido com settings, dentro de catch', () => {
    expect(parseOk('{=catch({site: text; selector=.cliente .nome}, "Não encontrado")}')).toEqual([
      formula(
        call(
          'catch',
          cmd('site', raw('text'), { selector: raw('.cliente .nome') }),
          str('Não encontrado'),
        ),
      ),
    ]);
  });

  it('parênteses', () => {
    expect(parseOk('{=("a")}')).toEqual([formula(str('a'))]);
  });
});

describe('atribuição {nome=...}', () => {
  it('guarda o resultado de uma expressão', () => {
    expect(parseOk('{id=extractregex({site: query}, "id=([^&]+)")}')).toEqual([
      assign('id', call('extractregex', cmd('site', raw('query')), str('id=([^&]+)'))),
    ]);
  });

  it('aceita espaços em volta do "="', () => {
    expect(parseOk('{id = "x" }')).toEqual([assign('id', str('x'))]);
  });

  it('atribuição seguida de uso', () => {
    expect(parseOk('{id="42"}Pedido {=id}')).toEqual([
      assign('id', str('42')),
      text('Pedido '),
      formula(variable('id')),
    ]);
  });
});

describe('erros em fórmulas', () => {
  it('função desconhecida lista as disponíveis', () => {
    const { message } = parseOneError('{=foo("a")}');
    expect(message).toContain('Função desconhecida');
    expect(message).toContain('foo');
    expect(message).toContain('extractregex');
  });

  it('número errado de argumentos', () => {
    const { message } = parseOneError('{=extractregex("a")}');
    expect(message).toContain('extractregex');
    expect(message).toContain('2 argumentos');
    expect(message).toContain('recebeu 1');
  });

  it('string não fechada', () => {
    expect(parseOneError('{="abc}').message).toContain('Faltou fechar as aspas');
  });

  it('aspas simples explicam que deve usar aspas duplas', () => {
    expect(parseOneError("{='abc'}").message).toContain('aspas duplas');
  });

  it('fórmula vazia', () => {
    expect(parseOneError('{=}').message).toContain('vazia');
  });

  it('atribuição sem expressão', () => {
    expect(parseOneError('{id=}').message).toContain('vazia');
  });

  it('falta fechar o parêntese', () => {
    expect(parseOneError('{=extractregex("a", "b"}').message).toContain("Esperava ',' ou ')'");
  });

  it('falta vírgula entre argumentos', () => {
    expect(parseOneError('{=extractregex("a" "b")}').message).toContain("Esperava ',' ou ')'");
  });

  it('sobra algo depois da expressão', () => {
    expect(parseOneError('{="a" "b"}').message).toContain("Esperava '}'");
  });

  it('números ainda não existem (Fase 2)', () => {
    expect(parseOneError('{=5}').message).toContain("Caractere inesperado '5'");
  });

  it('comando de bloco não pode ficar dentro de fórmula', () => {
    expect(parseOneError('{={else}}').message).toContain('não pode ser usado dentro de uma fórmula');
  });

  it('fórmula dentro de fórmula', () => {
    expect(parseOneError('{={="a"}}').message).toContain('dentro de outra fórmula');
  });

  it('erro dentro de comando embutido', () => {
    expect(parseOneError('{=catch({site: URL}, "x")}').message).toContain("'URL'");
  });

  it('comando desconhecido embutido', () => {
    expect(parseOneError('{=catch({foo}, "x")}').message).toContain('Comando desconhecido');
  });
});
