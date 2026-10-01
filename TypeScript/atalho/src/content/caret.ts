// =============================================================================
// Ler (e selecionar) o texto logo antes do cursor, onde o atalho foi digitado.
// =============================================================================

import type { EditableTarget } from './editable';

/** Elementos que começam uma "linha/bloco" nova: não juntamos texto entre eles. */
const BLOCK_TAGS = new Set([
  'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'DD', 'DIV', 'DL', 'DT', 'FIELDSET',
  'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'HEADER', 'LI', 'MAIN', 'NAV', 'OL', 'P', 'PRE', 'SECTION', 'TABLE', 'TD', 'TH',
  'TR', 'UL',
]);

/** Um nó de texto e até onde ele conta (o último vai só até o cursor). */
interface Segment {
  node: Text;
  end: number;
}

/**
 * Até `maxLength` caracteres antes do cursor, ou null quando não há um cursor
 * simples (ex.: o usuário selecionou um trecho) ou ele está fora do campo.
 */
export function readTextBeforeCaret(target: EditableTarget, maxLength: number): string | null {
  if (target.kind === 'text-control') {
    const caret = textControlCaret(target.element);
    if (caret === null) return null;
    return target.element.value.slice(Math.max(0, caret - maxLength), caret);
  }

  const segments = segmentsBeforeCaret(target.element);
  if (!segments) return null;
  const text = segments.map((segment) => segment.node.data.slice(0, segment.end)).join('');
  return text.slice(Math.max(0, text.length - maxLength));
}

/**
 * Posição do cursor num input/textarea; null se houver texto selecionado.
 * Alguns tipos (ex.: email) não têm API de seleção: aí consideramos o fim.
 */
export function textControlCaret(element: HTMLInputElement | HTMLTextAreaElement): number | null {
  let start: number | null;
  let end: number | null;
  try {
    start = element.selectionStart;
    end = element.selectionEnd;
  } catch {
    start = end = null;
  }
  if (start === null || end === null) return element.value.length;
  return start === end ? end : null;
}

/**
 * Range que cobre os últimos `length` caracteres antes do cursor num
 * contenteditable, mesmo que eles estejam espalhados em vários nós
 * (ex.: "<b>/s</b>ig"). Null se não houver texto suficiente.
 */
export function rangeBeforeCaret(host: HTMLElement, length: number): Range | null {
  const segments = segmentsBeforeCaret(host);
  const last = segments?.at(-1);
  if (!segments || !last) return null;

  const range = host.ownerDocument.createRange();
  range.setEnd(last.node, last.end);
  let remaining = length;
  // Anda de trás para frente, nó por nó, até juntar `length` caracteres.
  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = segments[i];
    if (!segment) continue;
    if (segment.end >= remaining) {
      range.setStart(segment.node, segment.end - remaining);
      return range;
    }
    remaining -= segment.end;
  }
  return null;
}

/**
 * Seleção certa para o elemento. Dentro de Shadow DOM, o Chrome tem
 * shadowRoot.getSelection(); fora dele, usamos document.getSelection().
 */
export function getSelectionFor(node: Node): Selection | null {
  const root = node.getRootNode() as Partial<{ getSelection: () => Selection | null }>;
  if (typeof root.getSelection === 'function') return root.getSelection();
  return node.ownerDocument?.getSelection() ?? null;
}

/** Nós de texto do bloco atual, do início do bloco até o cursor. */
function segmentsBeforeCaret(host: HTMLElement): Segment[] | null {
  const selection = getSelectionFor(host);
  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) return null;
  const caretNode = selection.focusNode;
  if (!caretNode || !host.contains(caretNode)) return null;
  const caretOffset = selection.focusOffset;

  const doc = host.ownerDocument;
  const caret = doc.createRange();
  caret.setStart(caretNode, caretOffset);
  caret.collapse(true);

  const walker = doc.createTreeWalker(closestBlock(caretNode, host), NodeFilter.SHOW_TEXT);
  const segments: Segment[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node as Text;
    if (text === caretNode) {
      segments.push({ node: text, end: caretOffset });
      break;
    }
    // comparePoint: -1 = antes do cursor, 0 = no cursor, 1 = depois do cursor.
    if (caret.comparePoint(text, text.length) > 0) break;
    segments.push({ node: text, end: text.length });
  }
  return segments;
}

/** O bloco (parágrafo, div, li...) onde está o cursor, sem sair do editor. */
function closestBlock(node: Node, host: HTMLElement): Node {
  let element: Element | null = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  while (element && element !== host) {
    if (BLOCK_TAGS.has(element.tagName)) return element;
    element = element.parentElement;
  }
  return host;
}
