import type { EditableTarget } from './editable';

/** Como o texto foi inserido: pelo caminho principal ou pelo plano B. */
export type InsertMethod = 'execCommand' | 'fallback';

/** ETAPA 6 (TDD): ainda não implementado. */
export function replaceBeforeCaret(target: EditableTarget, length: number, text: string): InsertMethod {
  void target;
  void length;
  void text;
  throw new Error('replaceBeforeCaret: não implementado (etapa 6)');
}
