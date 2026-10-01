// =============================================================================
// Regras para salvar um snippet. Funções puras (sem storage), fáceis de testar
// e usadas tanto pelo dashboard (mostrar erros no formulário) quanto pelo
// import de backup.
// =============================================================================

import { endsWithShortcut } from '@/shared/shortcut';
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

/**
 * Valida um snippet contra os que já existem.
 * @param editingId id do snippet sendo editado (ele não conta como "outro").
 */
export function validateSnippet(
  input: SnippetInput,
  existing: readonly Snippet[],
  editingId?: string,
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const name = input.name.trim();
  const shortcut = input.shortcut.trim();

  if (name === '') {
    errors.push({ field: 'name', message: 'Dê um nome ao snippet.' });
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.push({ field: 'name', message: `O nome pode ter no máximo ${NAME_MAX_LENGTH} caracteres.` });
  }

  const formatError = checkShortcutFormat(shortcut);
  if (formatError) {
    errors.push({ field: 'shortcut', message: formatError });
  } else {
    const others = existing.filter((snippet) => snippet.id !== editingId);
    const duplicate = others.find((snippet) => snippet.shortcut === shortcut);
    if (duplicate) {
      errors.push({
        field: 'shortcut',
        message: `Já existe um snippet com o atalho ${shortcut} ("${duplicate.name}").`,
      });
    } else {
      warnings.push(...findPrefixConflicts(shortcut, others));
    }
  }

  if (input.content.trim() === '') {
    errors.push({ field: 'content', message: 'O conteúdo do snippet está vazio.' });
  }

  return { errors, warnings };
}

function checkShortcutFormat(shortcut: string): string | null {
  if (shortcut === '') return 'O atalho é obrigatório.';
  if (/\s/.test(shortcut)) return 'O atalho não pode ter espaços.';
  if (shortcut.length < SHORTCUT_MIN_LENGTH) {
    return `O atalho precisa ter pelo menos ${SHORTCUT_MIN_LENGTH} caracteres (com 1 só, ele dispararia toda vez que você digitasse essa letra).`;
  }
  if (shortcut.length > SHORTCUT_MAX_LENGTH) {
    return `O atalho pode ter no máximo ${SHORTCUT_MAX_LENGTH} caracteres.`;
  }
  return null;
}

/**
 * A expansão acontece assim que o texto antes do cursor TERMINA com um atalho
 * que está separado do que vem antes (regra em src/shared/shortcut.ts).
 * Então o atalho A "atropela" o B se, ao digitar B do começo, o texto em algum
 * momento (antes da última letra) termina com A separado:
 *   "/s"  atropela "/sig"  (ao digitar "/s", já expande)
 *   "dt"  atropela "-dtx"  (em "-dt", o "dt" vem depois de "-", que separa)
 *   "si"  NÃO atropela "/sig" (em "/si", o "si" está colado na "/")
 *   "ig"  NÃO atropela "/sig" (os dois terminam juntos; o mais longo vence)
 */
function blocks(a: string, b: string): boolean {
  for (let typed = a.length; typed < b.length; typed++) {
    if (endsWithShortcut(b.slice(0, typed), a)) return true;
  }
  return false;
}

function findPrefixConflicts(shortcut: string, others: readonly Snippet[]): ValidationIssue[] {
  const warnings: ValidationIssue[] = [];
  for (const other of others) {
    if (blocks(other.shortcut, shortcut)) {
      warnings.push({
        field: 'shortcut',
        message: `Ao digitar ${shortcut}, o atalho ${other.shortcut} ("${other.name}") vai disparar antes de você terminar. Troque um dos dois atalhos.`,
      });
    } else if (blocks(shortcut, other.shortcut)) {
      warnings.push({
        field: 'shortcut',
        message: `Este atalho vai disparar antes de você terminar de digitar ${other.shortcut} ("${other.name}"). Troque um dos dois atalhos.`,
      });
    }
  }
  return warnings;
}
