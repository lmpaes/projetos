// =============================================================================
// Editores de texto rico com "modelo próprio".
// -----------------------------------------------------------------------------
// Editores como o CKEditor 5 (usado no Zendesk) guardam o texto numa estrutura
// interna (o "modelo") e redesenham a tela a partir dela. Se mudarmos o HTML
// "por fora", o editor desfaz a mudança. Com eles, a inserção tem que entrar
// por um caminho que o editor entende: a colagem (paste). Ver insert.ts.
// =============================================================================

/** Editores de texto rico que têm "modelo próprio" (e desfazem mudanças feitas por fora). */
export type RichEditorKind = 'ckeditor5' | 'prosemirror' | 'lexical' | 'slate' | 'quill' | 'draftjs';

/** Marcas que cada editor deixa no HTML da área de edição. */
const MARKERS: ReadonlyArray<readonly [RichEditorKind, string]> = [
  ['ckeditor5', '.ck-editor__editable'],
  ['prosemirror', '.ProseMirror'],
  ['lexical', '[data-lexical-editor]'],
  ['slate', '[data-slate-editor]'],
  ['quill', '.ql-editor'],
  ['draftjs', '.public-DraftEditor-content'],
];

/** Qual editor rico contém este elemento (ou null, se for um campo comum). */
export function detectRichEditor(element: Element): RichEditorKind | null {
  for (const [kind, selector] of MARKERS) {
    if (element.closest(selector)) return kind;
  }
  return null;
}
