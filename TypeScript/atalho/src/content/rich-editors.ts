/** Editores de texto rico que têm "modelo próprio" (e desfazem mudanças feitas por fora). */
export type RichEditorKind = 'ckeditor5' | 'prosemirror' | 'lexical' | 'slate' | 'quill' | 'draftjs';

/** ETAPA 7.1 (TDD): ainda não implementado. */
export function detectRichEditor(element: Element): RichEditorKind | null {
  void element;
  throw new Error('detectRichEditor: não implementado (etapa 7.1)');
}
