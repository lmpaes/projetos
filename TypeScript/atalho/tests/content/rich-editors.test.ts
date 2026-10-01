// Especificação: reconhecer editores ricos que têm "modelo próprio".
import { afterEach, describe, expect, it } from 'vitest';
import { detectRichEditor } from '@/content/rich-editors';

afterEach(() => {
  document.body.innerHTML = '';
});

function make(html: string): Element {
  document.body.innerHTML = html;
  return document.body.firstElementChild as Element;
}

describe('detectRichEditor', () => {
  it.each([
    ['ckeditor5', '<div class="ck ck-content ck-editor__editable" contenteditable="true"></div>'],
    ['prosemirror', '<div class="ProseMirror" contenteditable="true"></div>'],
    ['lexical', '<div data-lexical-editor="true" contenteditable="true"></div>'],
    ['slate', '<div data-slate-editor="true" contenteditable="true"></div>'],
    ['quill', '<div class="ql-editor" contenteditable="true"></div>'],
    ['draftjs', '<div class="public-DraftEditor-content" contenteditable="true"></div>'],
  ])('%s', (kind, html) => {
    expect(detectRichEditor(make(html))).toBe(kind);
  });

  it('reconhece também por um elemento de dentro do editor', () => {
    const host = make('<div class="ck-editor__editable" contenteditable="true"><p><b>x</b></p></div>');
    expect(detectRichEditor(host.querySelector('b') as Element)).toBe('ckeditor5');
  });

  it('contenteditable comum (ex.: Gmail) não é "editor com modelo"', () => {
    expect(detectRichEditor(make('<div contenteditable="true" class="Am aiL"></div>'))).toBeNull();
  });
});
