// =============================================================================
// Troca o atalho (os N caracteres antes do cursor) pelo texto do snippet.
// -----------------------------------------------------------------------------
// Caminho principal: selecionar o atalho e chamar
// document.execCommand('insertText'). É como se o usuário tivesse digitado o
// texto: o Ctrl+Z funciona, e editores como Gmail, React e ProseMirror
// entendem a mudança.
//
// Plano B (se o execCommand não existir ou recusar):
//   - input/textarea: setter NATIVO de value + eventos input/change;
//   - contenteditable: troca os nós de texto à mão + evento input.
// =============================================================================

import { getSelectionFor, rangeBeforeCaret, textControlCaret } from './caret';
import type { EditableTarget } from './editable';

/** Como o texto foi inserido: pelo caminho principal ou pelo plano B. */
export type InsertMethod = 'execCommand' | 'fallback';

/**
 * Substitui os `length` caracteres antes do cursor por `text`.
 * Devolve null se não conseguiu achar o trecho (o cursor saiu do lugar).
 */
export function replaceBeforeCaret(target: EditableTarget, length: number, text: string): InsertMethod | null {
  return target.kind === 'text-control'
    ? replaceInTextControl(target.element, length, text)
    : replaceInContentEditable(target.element, length, text);
}

// -----------------------------------------------------------------------------
// input / textarea
// -----------------------------------------------------------------------------

function replaceInTextControl(
  element: HTMLInputElement | HTMLTextAreaElement,
  length: number,
  rawText: string,
): InsertMethod {
  // <input> é de uma linha só: quebras de linha viram espaço.
  const text = element.tagName === 'INPUT' ? rawText.replace(/\r?\n/g, ' ') : rawText;
  const end = textControlCaret(element) ?? element.value.length;
  const start = Math.max(0, end - length);

  if (trySelect(element, start, end) && execInsertText(element.ownerDocument, text)) {
    return 'execCommand';
  }

  // Plano B
  const value = element.value;
  setNativeValue(element, value.slice(0, start) + text + value.slice(end));
  trySelect(element, start + text.length, start + text.length);
  element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  return 'fallback';
}

/**
 * Muda o value "por baixo", com o setter original do navegador.
 *
 * Por quê? O React troca o `value` do elemento por um setter próprio que
 * memoriza o último valor. Se fizermos `element.value = x`, o React memoriza
 * "x", e quando o evento input chega ele acha que nada mudou: o estado do
 * componente não atualiza. Usando o setter do protótipo, o React percebe a
 * diferença e chama o onChange.
 */
function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  let prototype: object | null = Object.getPrototypeOf(element) as object | null;
  while (prototype) {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
    if (descriptor?.set) {
      descriptor.set.call(element, value);
      return;
    }
    prototype = Object.getPrototypeOf(prototype) as object | null;
  }
  element.value = value;
}

/** Seleciona [start, end); false se o tipo de campo não permitir (ex.: email). */
function trySelect(element: HTMLInputElement | HTMLTextAreaElement, start: number, end: number): boolean {
  try {
    element.setSelectionRange(start, end);
    return true;
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// contenteditable
// -----------------------------------------------------------------------------

function replaceInContentEditable(host: HTMLElement, length: number, text: string): InsertMethod | null {
  const doc = host.ownerDocument;
  const range = rangeBeforeCaret(host, length);
  const selection = getSelectionFor(host);
  if (!range || !selection) return null;

  selection.removeAllRanges();
  selection.addRange(range);
  if (execInsertText(doc, text)) return 'execCommand';

  // Plano B: apaga o atalho e insere o texto como nós de TEXTO (nunca HTML),
  // com <br> nas quebras de linha.
  range.deleteContents();
  const fragment = doc.createDocumentFragment();
  text.split(/\r?\n/).forEach((line, index) => {
    if (index > 0) fragment.append(doc.createElement('br'));
    if (line !== '') fragment.append(doc.createTextNode(line));
  });
  const lastInserted = fragment.lastChild;
  range.insertNode(fragment);

  // Cursor logo depois do texto inserido.
  const caret = doc.createRange();
  if (lastInserted) caret.setStartAfter(lastInserted);
  else caret.setStart(range.startContainer, range.startOffset);
  caret.collapse(true);
  selection.removeAllRanges();
  selection.addRange(caret);

  host.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
  return 'fallback';
}

// -----------------------------------------------------------------------------

/** Tenta o execCommand('insertText'). O jsdom (testes) nem tem execCommand. */
function execInsertText(doc: Document, text: string): boolean {
  if (typeof doc.execCommand !== 'function') return false;
  try {
    return doc.execCommand('insertText', false, text);
  } catch {
    return false;
  }
}
