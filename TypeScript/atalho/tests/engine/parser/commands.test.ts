// Especificação: comandos {nome: posicional; chave=valor}.
import { describe, expect, it } from 'vitest';
import { SITE_TYPES } from '../../fixtures/syntax';
import { cmd, parseOk, parseOneError, raw, text } from '../../helpers/ast';

describe('comando sem argumento', () => {
  it('{clipboard}', () => {
    expect(parseOk('{clipboard}')).toEqual([cmd('clipboard')]);
  });

  it('aceita espaço antes do "}"', () => {
    expect(parseOk('{clipboard }')).toEqual([cmd('clipboard')]);
  });

  it('espaço logo após "{" faz virar texto literal', () => {
    expect(parseOk('{ clipboard}')).toEqual([text('{ clipboard}')]);
  });
});

describe('argumento posicional', () => {
  it.each(SITE_TYPES)('{site: %s}', (type) => {
    expect(parseOk(`{site: ${type}}`)).toEqual([cmd('site', raw(type))]);
  });

  it('dispensa o espaço depois de ":"', () => {
    expect(parseOk('{site:url}')).toEqual([cmd('site', raw('url'))]);
  });

  it('apara os espaços das pontas', () => {
    expect(parseOk('{site:   url   }')).toEqual([cmd('site', raw('url'))]);
  });

  it('{time: DD/MM/YYYY}', () => {
    expect(parseOk('{time: DD/MM/YYYY}')).toEqual([cmd('time', raw('DD/MM/YYYY'))]);
  });

  it('":" dentro do valor não atrapalha', () => {
    expect(parseOk('{time: HH:mm}')).toEqual([cmd('time', raw('HH:mm'))]);
  });

  it('colchetes do dayjs mantêm espaços e acentos', () => {
    expect(parseOk('{time: [Hoje é] dddd}')).toEqual([cmd('time', raw('[Hoje é] dddd'))]);
  });

  it('aspas simples são um caractere comum (apóstrofo)', () => {
    expect(parseOk("{time: [d'água] HH}")).toEqual([cmd('time', raw("[d'água] HH"))]);
  });

  it('aceita ";" sobrando no final', () => {
    expect(parseOk('{site: url;}')).toEqual([cmd('site', raw('url'))]);
  });
});

describe('settings (chave=valor)', () => {
  it('selector com espaços internos', () => {
    expect(parseOk('{site: text; selector=.cliente .nome}')).toEqual([
      cmd('site', raw('text'), { selector: raw('.cliente .nome') }),
    ]);
  });

  it('várias settings', () => {
    expect(parseOk('{site: text; selector=li; multiple=yes}')).toEqual([
      cmd('site', raw('text'), { selector: raw('li'), multiple: raw('yes') }),
    ]);
  });

  it('espaços em volta de "=" e ";"', () => {
    expect(parseOk('{site: text ;  selector = #a ; multiple = no }')).toEqual([
      cmd('site', raw('text'), { selector: raw('#a'), multiple: raw('no') }),
    ]);
  });

  it('";" e "}" entre aspas fazem parte do valor', () => {
    expect(parseOk('{site: text; selector=a[title="x;y}"]}')).toEqual([
      cmd('site', raw('text'), { selector: raw('a[title="x;y}"]') }),
    ]);
  });

  it('"=" entre colchetes faz parte do valor', () => {
    expect(parseOk('{site: text; selector=input[name=email]}')).toEqual([
      cmd('site', raw('text'), { selector: raw('input[name=email]') }),
    ]);
  });

  it('parênteses fazem parte do valor', () => {
    expect(parseOk('{site: text; selector=li:nth-child(2)}')).toEqual([
      cmd('site', raw('text'), { selector: raw('li:nth-child(2)') }),
    ]);
  });

  it('\\; e \\} escapados viram caracteres literais', () => {
    expect(parseOk(String.raw`{time: HH\;mm\}}`)).toEqual([cmd('time', raw('HH;mm}'))]);
  });

  it('outras barras ficam como estão (escape de CSS)', () => {
    expect(parseOk(String.raw`{site: text; selector=#foo\:bar}`)).toEqual([
      cmd('site', raw('text'), { selector: raw(String.raw`#foo\:bar`) }),
    ]);
  });
});

describe('erros de comando', () => {
  it('comando desconhecido lista os disponíveis', () => {
    const { message } = parseOneError('{foo}');
    expect(message).toContain('Comando desconhecido');
    expect(message).toContain('{foo}');
    expect(message).toContain('site');
    expect(message).toContain('clipboard');
  });

  it('dá a dica quando o erro é só de maiúscula/minúscula', () => {
    expect(parseOneError('{Site: url}').message).toContain('Você quis dizer {site}?');
  });

  it('valor fora da lista (diferencia maiúsculas)', () => {
    const { message } = parseOneError('{site: URL}');
    expect(message).toContain("'URL'");
    expect(message).toContain('url, domain, path');
    expect(message).toContain('maiúsculas');
  });

  it('argumento obrigatório ausente mostra um exemplo', () => {
    const { message } = parseOneError('{site}');
    expect(message).toContain('precisa de um argumento');
    expect(message).toContain('{site: url}');
  });

  it('argumento vazio conta como ausente', () => {
    expect(parseOneError('{site: }').message).toContain('precisa de um argumento');
  });

  it('comando que não aceita argumento', () => {
    expect(parseOneError('{clipboard: x}').message).toContain('não aceita argumento');
  });

  it('setting desconhecida lista as aceitas', () => {
    const { message } = parseOneError('{site: text; seletor=.a}');
    expect(message).toContain("'seletor'");
    expect(message).toContain('selector');
  });

  it('setting repetida', () => {
    expect(parseOneError('{site: text; selector=.a; selector=.b}').message).toContain('repetida');
  });

  it('valor de setting fora da lista', () => {
    const { message } = parseOneError('{site: text; selector=.a; multiple=sim}');
    expect(message).toContain("'sim'");
    expect(message).toContain('yes, no');
  });

  it('setting sem "="', () => {
    expect(parseOneError('{site: text; multiple}').message).toContain("Esperava '='");
  });

  it('regra extra do comando (validate)', () => {
    expect(parseOneError('{site: url; selector=.a}').message).toContain('só vale com');
  });

  it('falta ":" depois do nome', () => {
    expect(parseOneError('{site url}').message).toContain("Esperava ':' ou '}'");
  });

  it('aspas não fechadas no valor', () => {
    expect(parseOneError('{site: text; selector=a[title="x]}').message).toContain('Aspas');
  });

  it('"{" sem escape dentro de argumento', () => {
    expect(parseOneError('{site: text; selector={x}}').message).toContain(String.raw`\{`);
  });
});
