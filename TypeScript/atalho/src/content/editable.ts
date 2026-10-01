// =============================================================================
// Em quais campos o Atalho pode expandir snippets.
// =============================================================================

/** Um campo onde dá para expandir snippets. */
export type EditableTarget =
  | { kind: 'text-control'; element: HTMLInputElement | HTMLTextAreaElement }
  | { kind: 'contenteditable'; element: HTMLElement };

/**
 * Tipos de <input> onde faz sentido expandir texto.
 * "password" fica de fora DE PROPÓSITO: nunca mexemos em campos de senha.
 */
const TEXT_INPUT_TYPES = new Set(['text', 'search', 'email', 'url', 'tel']);

/** Valores de contenteditable que tornam o elemento editável. */
const EDITABLE_VALUES = new Set(['', 'true', 'plaintext-only']);

/**
 * Descobre se o alvo de um evento é um campo editável.
 * Usamos tagName em vez de `instanceof HTMLInputElement` porque elementos de
 * iframes têm construtores diferentes (cada janela tem os seus).
 */
export function findEditableTarget(target: EventTarget | null): EditableTarget | null {
  const element = toElement(target);
  if (!element) return null;

  if (element.tagName === 'TEXTAREA') {
    const textarea = element as HTMLTextAreaElement;
    return textarea.readOnly || textarea.disabled ? null : { kind: 'text-control', element: textarea };
  }

  if (element.tagName === 'INPUT') {
    const input = element as HTMLInputElement;
    if (!TEXT_INPUT_TYPES.has(input.type) || input.readOnly || input.disabled) return null;
    return { kind: 'text-control', element: input };
  }

  // contenteditable: o próprio elemento ou um ancestral (ex.: <b> dentro do editor).
  const host = element.closest('[contenteditable]');
  const value = host?.getAttribute('contenteditable')?.toLowerCase();
  if (!host || value === undefined || !EDITABLE_VALUES.has(value)) return null;
  return { kind: 'contenteditable', element: host as HTMLElement };
}

/** Converte o alvo do evento num Element (texto → o elemento pai). */
function toElement(target: EventTarget | null): Element | null {
  if (!target || typeof (target as Partial<Node>).nodeType !== 'number') return null;
  const node = target as Node;
  return node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
}
