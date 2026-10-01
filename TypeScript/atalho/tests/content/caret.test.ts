// Especificação: ler o texto logo antes do cursor (onde o atalho foi digitado).
import { afterEach, describe, expect, it } from 'vitest';
import { rangeBeforeCaret, readTextBeforeCaret } from '@/content/caret';
import { caretAtEnd, editable, input, resetDom, setCaret, textarea } from './dom';

afterEach(resetDom);

describe('readTextBeforeCaret — input e textarea', () => {
  it('lê até o cursor, limitado a maxLength', () => {
    const element = textarea('Oi /sig mundo', 7);
    expect(readTextBeforeCaret({ kind: 'text-control', element }, 4)).toBe('/sig');
    expect(readTextBeforeCaret({ kind: 'text-control', element }, 50)).toBe('Oi /sig');
  });

  it('com texto selecionado (não só o cursor), não lê nada', () => {
    const element = textarea('Oi /sig');
    element.setSelectionRange(0, 2);
    expect(readTextBeforeCaret({ kind: 'text-control', element }, 10)).toBeNull();
  });

  it('input de e-mail (sem API de seleção) considera o cursor no fim', () => {
    const element = input('email', 'eu/em');
    expect(readTextBeforeCaret({ kind: 'text-control', element }, 3)).toBe('/em');
  });
});

describe('readTextBeforeCaret — contenteditable', () => {
  it('cursor no fim do texto', () => {
    const host = editable('Olá /sig');
    caretAtEnd(host);
    expect(readTextBeforeCaret({ kind: 'contenteditable', element: host }, 4)).toBe('/sig');
  });

  it('cursor no meio do texto', () => {
    const host = editable('Olá /sig mundo');
    setCaret(host.firstChild as Text, 8);
    expect(readTextBeforeCaret({ kind: 'contenteditable', element: host }, 50)).toBe('Olá /sig');
  });

  it('atalho quebrado em pedaços de formatação ("Olá <b>/s</b>ig")', () => {
    const host = editable('Olá <b>/s</b>ig');
    caretAtEnd(host);
    expect(readTextBeforeCaret({ kind: 'contenteditable', element: host }, 50)).toBe('Olá /sig');
  });

  it('não junta texto de parágrafos (blocos) diferentes', () => {
    const host = editable('<div>abc /s</div><div>ig</div>');
    caretAtEnd(host);
    expect(readTextBeforeCaret({ kind: 'contenteditable', element: host }, 50)).toBe('ig');
  });

  it('cursor posicionado "entre elementos" também funciona', () => {
    const host = editable('Olá /sig');
    setCaret(host, 1);
    expect(readTextBeforeCaret({ kind: 'contenteditable', element: host }, 4)).toBe('/sig');
  });

  it('com texto selecionado, não lê nada', () => {
    const host = editable('Olá /sig');
    const range = document.createRange();
    range.selectNodeContents(host);
    document.getSelection()?.addRange(range);
    expect(readTextBeforeCaret({ kind: 'contenteditable', element: host }, 4)).toBeNull();
  });

  it('cursor fora do editor: não lê nada', () => {
    const host = editable('Olá /sig');
    const other = editable('outro');
    caretAtEnd(other);
    expect(readTextBeforeCaret({ kind: 'contenteditable', element: host }, 4)).toBeNull();
  });
});

describe('caracteres invisíveis (o CKEditor 5 usa \u2060 como "preenchimento")', () => {
  it('são ignorados ao ler o texto antes do cursor', () => {
    const host = editable('Oi \u2060\u2060\u2060/atd');
    caretAtEnd(host);
    expect(readTextBeforeCaret({ kind: 'contenteditable', element: host }, 50)).toBe('Oi /atd');
    expect(readTextBeforeCaret({ kind: 'contenteditable', element: host }, 4)).toBe('/atd');
  });

  it('não contam no tamanho do atalho ao selecionar para trocar', () => {
    const host = editable('Oi /a\u2060td');
    caretAtEnd(host);
    const range = rangeBeforeCaret(host, 4);
    expect(range?.toString()).toBe('/a\u2060td');
    range?.deleteContents();
    expect(host.textContent).toBe('Oi ');
  });
});

describe('rangeBeforeCaret', () => {
  it('cobre exatamente os últimos N caracteres, mesmo entre elementos', () => {
    const host = editable('Olá <b>/s</b>ig');
    caretAtEnd(host);
    const range = rangeBeforeCaret(host, 4);
    expect(range?.toString()).toBe('/sig');
    range?.deleteContents();
    expect(host.textContent).toBe('Olá ');
  });

  it('devolve null se não houver texto suficiente antes do cursor', () => {
    const host = editable('/s');
    caretAtEnd(host);
    expect(rangeBeforeCaret(host, 4)).toBeNull();
  });
});
