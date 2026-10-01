// Especificação: em quais campos o Atalho expande snippets.
import { afterEach, describe, expect, it } from 'vitest';
import { findEditableTarget } from '@/content/editable';
import { editable, resetDom } from './dom';

afterEach(resetDom);

function make(html: string): Element {
  document.body.innerHTML = html;
  return document.body.firstElementChild as Element;
}

describe('findEditableTarget', () => {
  it('textarea', () => {
    const element = make('<textarea></textarea>');
    expect(findEditableTarget(element)).toEqual({ kind: 'text-control', element });
  });

  it.each(['text', 'search', 'email', 'url', 'tel'])('input type=%s', (type) => {
    const element = make(`<input type="${type}">`);
    expect(findEditableTarget(element)?.kind).toBe('text-control');
  });

  it('input sem type (o padrão é text)', () => {
    expect(findEditableTarget(make('<input>'))?.kind).toBe('text-control');
  });

  it.each(['password', 'number', 'date', 'checkbox', 'hidden'])('ignora input type=%s', (type) => {
    expect(findEditableTarget(make(`<input type="${type}">`))).toBeNull();
  });

  it('ignora campos readonly e disabled', () => {
    expect(findEditableTarget(make('<textarea readonly></textarea>'))).toBeNull();
    expect(findEditableTarget(make('<input disabled>'))).toBeNull();
  });

  it.each(['true', '', 'plaintext-only'])('contenteditable="%s"', (value) => {
    const element = make(`<div contenteditable="${value}">oi</div>`);
    expect(findEditableTarget(element)).toEqual({ kind: 'contenteditable', element });
  });

  it('elemento dentro de um contenteditable devolve o editor (host)', () => {
    const host = editable('<p><b>texto</b></p>');
    const bold = host.querySelector('b');
    expect(findEditableTarget(bold)).toEqual({ kind: 'contenteditable', element: host });
  });

  it('trecho com contenteditable="false" dentro do editor é ignorado', () => {
    const host = editable('<span contenteditable="false">fixo</span>');
    expect(findEditableTarget(host.querySelector('span'))).toBeNull();
  });

  it('elementos comuns e null não são editáveis', () => {
    expect(findEditableTarget(make('<div>texto</div>'))).toBeNull();
    expect(findEditableTarget(null)).toBeNull();
    expect(findEditableTarget(document)).toBeNull();
  });
});
