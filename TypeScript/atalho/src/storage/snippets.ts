import { storage } from 'wxt/utils/storage';
import type { Snippet, SnippetInput } from '@/shared/types';
import type { BackupFile, ImportedSnippet, ImportMode, ImportReport } from './backup';
import type { ValidationIssue } from './validation';

/**
 * Onde os snippets ficam: chrome.storage.local, na chave "snippets".
 * `version` permite migrar o formato no futuro sem perder dados.
 */
export const snippetsItem = storage.defineItem<Snippet[]>('local:snippets', {
  fallback: [],
  version: 1,
});

/** Relógio e gerador de ids injetáveis (os testes usam valores fixos). */
export interface StoreOptions {
  now?: () => number;
  newId?: () => string;
}

export type SaveResult =
  | { ok: true; snippet: Snippet; warnings: ValidationIssue[] }
  | { ok: false; errors: ValidationIssue[]; warnings: ValidationIssue[] };

const notImplemented = (name: string) => Promise.reject(new Error(`${name}: não implementado (etapa 5)`));

/** ETAPA 5 (TDD): ainda não implementado. */
export function listSnippets(): Promise<Snippet[]> {
  return notImplemented('listSnippets');
}

/** ETAPA 5 (TDD): ainda não implementado. */
export function createSnippet(input: SnippetInput, options: StoreOptions = {}): Promise<SaveResult> {
  void input;
  void options;
  return notImplemented('createSnippet');
}

/** ETAPA 5 (TDD): ainda não implementado. */
export function updateSnippet(id: string, input: SnippetInput, options: StoreOptions = {}): Promise<SaveResult> {
  void id;
  void input;
  void options;
  return notImplemented('updateSnippet');
}

/** ETAPA 5 (TDD): ainda não implementado. */
export function deleteSnippet(id: string): Promise<void> {
  void id;
  return notImplemented('deleteSnippet');
}

/** ETAPA 5 (TDD): ainda não implementado. */
export function watchSnippets(callback: (snippets: Snippet[]) => void): () => void {
  void callback;
  throw new Error('watchSnippets: não implementado (etapa 5)');
}

/** ETAPA 5 (TDD): ainda não implementado. */
export function exportBackup(now: Date = new Date()): Promise<BackupFile> {
  void now;
  return notImplemented('exportBackup');
}

/** ETAPA 5 (TDD): ainda não implementado. */
export function importBackup(
  items: readonly ImportedSnippet[],
  mode: ImportMode,
  options: StoreOptions = {},
): Promise<ImportReport> {
  void items;
  void mode;
  void options;
  return notImplemented('importBackup');
}
