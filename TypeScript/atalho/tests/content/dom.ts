// Utilitários de DOM para os testes do content script.
import { vi } from 'vitest';

/** Cria uma textarea na página, com o cursor na posição `caret` (padrão: fim). */
export function textarea(value: string, caret = value.length): HTMLTextAreaElement {
  const element = document.createElement('textarea');
  document.body.append(element);
  element.value = value;
  element.focus();
  element.setSelectionRange(caret, caret);
  return element;
}

export function input(type: string, value = '', caret = value.length): HTMLInputElement {
  const element = document.createElement('input');
  element.type = type;
  document.body.append(element);
  element.value = value;
  element.focus();
  try {
    element.setSelectionRange(caret, caret);
  } catch {
    // tipos como "email" não têm API de seleção
  }
  return element;
}

/** Cria um <div contenteditable> com o HTML dado. */
export function editable(html: string): HTMLDivElement {
  const element = document.createElement('div');
  element.setAttribute('contenteditable', 'true');
  element.innerHTML = html;
  document.body.append(element);
  return element;
}

/** Coloca o cursor (seleção recolhida) em node/offset. */
export function setCaret(node: Node, offset: number): void {
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  const selection = document.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

/** Cursor no fim do último nó de texto do elemento. */
export function caretAtEnd(element: Element): void {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let last: Text | null = null;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) last = node as Text;
  if (last) setCaret(last, last.length);
  else setCaret(element, element.childNodes.length);
}

/** Texto do início do elemento até o cursor (para conferir onde o cursor ficou). */
export function textUntilCaret(element: Element): string {
  const selection = document.getSelection();
  if (!selection || selection.rangeCount === 0) return '';
  const range = document.createRange();
  range.setStart(element, 0);
  range.setEnd(selection.focusNode as Node, selection.focusOffset);
  return range.toString();
}

/** O jsdom não tem document.execCommand: instalamos um falso quando o teste precisa. */
export function mockExecCommand(
  implementation: (command: string, showUI: boolean, value: string) => boolean,
) {
  const mock = vi.fn(implementation);
  Object.defineProperty(document, 'execCommand', { value: mock, configurable: true, writable: true });
  return mock;
}

/** Volta ao normal do jsdom (sem execCommand) e limpa a página. */
export function resetDom(): void {
  Reflect.deleteProperty(document, 'execCommand');
  document.body.innerHTML = '';
  document.getSelection()?.removeAllRanges();
}
