/** Um campo onde dá para expandir snippets. */
export type EditableTarget =
  | { kind: 'text-control'; element: HTMLInputElement | HTMLTextAreaElement }
  | { kind: 'contenteditable'; element: HTMLElement };

/** ETAPA 6 (TDD): ainda não implementado. */
export function findEditableTarget(target: EventTarget | null): EditableTarget | null {
  void target;
  throw new Error('findEditableTarget: não implementado (etapa 6)');
}
