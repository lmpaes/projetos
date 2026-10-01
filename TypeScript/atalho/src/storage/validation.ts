import type { Snippet, SnippetInput } from '@/shared/types';

export const NAME_MAX_LENGTH = 100;
export const SHORTCUT_MIN_LENGTH = 2;
export const SHORTCUT_MAX_LENGTH = 50;

export interface ValidationIssue {
  field: 'name' | 'shortcut' | 'content' | 'general';
  message: string;
}

/** errors impedem salvar; warnings só avisam. */
export interface ValidationResult {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

/** ETAPA 5 (TDD): ainda não implementado. */
export function validateSnippet(
  input: SnippetInput,
  existing: readonly Snippet[],
  editingId?: string,
): ValidationResult {
  void input;
  void existing;
  void editingId;
  throw new Error('validateSnippet: não implementado (etapa 5)');
}
