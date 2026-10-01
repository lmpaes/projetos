// =============================================================================
// Troca o atalho (os N caracteres antes do cursor) pelo texto do snippet.
// -----------------------------------------------------------------------------
// 1. Editores com "modelo próprio" (CKEditor 5 do Zendesk, ProseMirror,
//    Lexical, Slate...): selecionamos o atalho e disparamos uma COLAGEM
//    sintética (evento paste com o texto). O editor insere pelo próprio
//    caminho dele, então nada é desfeito e o Ctrl+Z funciona.
// 2. Caminho principal (Gmail, campos comuns): selecionar o atalho e chamar
//    document.execCommand('insertText'). É como se o usuário tivesse digitado.
// 3. Plano B (se o execCommand não existir ou recusar):
//    - input/textarea: setter NATIVO de value + eventos input/change;
//    - contenteditable: troca os nós de texto à mão + evento input.
// =============================================================================

import { getSelectionFor, rangeBeforeCaret, textControlCaret } from './caret';
import type { EditableTarget } from './editable';
import { detectRichEditor } from './rich-editors';

/** Como o texto foi inserido: colagem sintética, caminho principal ou plano B. */
export type InsertMethod = 'paste' | 'execCommand' | 'fallback';

/**
 * Substitui os `length` caracteres antes do cursor por `text`.
 * Devolve null se não conseguiu achar o trecho (o cursor saiu do lugar).
 */
export async function replaceBeforeCaret(
  target: EditableTarget,
  length: number,
  text: string,
): Promise<InsertMethod | null> {
  if (target.kind === 'text-control') return replaceInTextControl(target.element, length, text);
  return replaceInContentEditable(target.element, length, text);
}

/**
 * Espera a página processar a mudança de seleção.
 * Editores como o CKEditor 5 só atualizam a seleção do "modelo" deles quando
 * recebem o evento selectionchange (que o navegador manda um pouco depois).
 * Se colássemos antes disso, o texto entraria no lugar antigo do cursor.
 */
export function waitForSelectionSync(doc: Document, timeoutMs = 50): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      doc.removeEventListener('selectionchange', done);
      resolve();
    };
    const timer = setTimeout(done, timeoutMs);
    doc.addEventListener('selectionchange', done);
  });
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

async function replaceInContentEditable(
  host: HTMLElement,
  length: number,
  text: string,
): Promise<InsertMethod | null> {
  const doc = host.ownerDocument;
  const range = rangeBeforeCaret(host, length);
  const selection = getSelectionFor(host);
  if (!range || !selection) return null;

  selection.removeAllRanges();
  selection.addRange(range);

  // Editor com modelo próprio: colagem sintética (se o editor tratar o evento).
  if (detectRichEditor(host)) {
    await waitForSelectionSync(doc);
    if (dispatchSyntheticPaste(selection, host, text)) return 'paste';
    // O editor não tratou a colagem: o atalho continua selecionado e seguimos.
    selection.removeAllRanges();
    selection.addRange(range);
  }

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

/**
 * Dispara um evento "paste" com o texto, como se o usuário tivesse colado.
 * Só vai TEXTO PURO (text/plain), nunca HTML. Devolve true se o editor tratou
 * a colagem (ele chama preventDefault() quando insere o texto por conta própria).
 */
function dispatchSyntheticPaste(selection: Selection, host: HTMLElement, text: string): boolean {
  if (typeof DataTransfer !== 'function') return false;
  const data = new DataTransfer();
  data.setData('text/plain', text);

  let event: Event;
  try {
    event = new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true });
  } catch {
    // Ambientes sem ClipboardEvent completo: um Event comum com clipboardData.
    event = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', { value: data });
  }

  // Dispara no elemento onde está a seleção, para "subir" por todo o editor.
  const anchor = selection.anchorNode;
  const target = anchor instanceof Element ? anchor : (anchor?.parentElement ?? host);
  target.dispatchEvent(event);
  return event.defaultPrevented;
}

/** Tenta o execCommand('insertText'). O jsdom (testes) nem tem execCommand. */
function execInsertText(doc: Document, text: string): boolean {
  if (typeof doc.execCommand !== 'function') return false;
  try {
    return doc.execCommand('insertText', false, text);
  } catch {
    return false;
  }
}
