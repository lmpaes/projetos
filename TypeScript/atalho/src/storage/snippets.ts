// =============================================================================
// CRUD de snippets no chrome.storage.local.
// -----------------------------------------------------------------------------
// Usamos o "storage item" do WXT: uma chave tipada ("local:snippets") com valor
// padrão e número de versão (para migrar o formato no futuro, se precisar).
// =============================================================================

import { storage } from 'wxt/utils/storage';
import type { Snippet, SnippetInput } from '@/shared/types';
import {
  createBackup,
  planImport,
  type BackupFile,
  type ImportedSnippet,
  type ImportMode,
  type ImportReport,
} from './backup';
import { validateSnippet, type ValidationIssue } from './validation';

/** Onde os snippets ficam: chrome.storage.local, chave "snippets". */
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

function resolveOptions(options: StoreOptions): Required<StoreOptions> {
  return {
    now: options.now ?? (() => Date.now()),
    newId: options.newId ?? (() => crypto.randomUUID()),
  };
}

/** Espaços nas pontas do nome e do atalho não fazem parte deles. */
function normalize(input: SnippetInput): SnippetInput {
  return { name: input.name.trim(), shortcut: input.shortcut.trim(), content: input.content };
}

export function listSnippets(): Promise<Snippet[]> {
  return snippetsItem.getValue();
}

export async function createSnippet(input: SnippetInput, options: StoreOptions = {}): Promise<SaveResult> {
  const { now, newId } = resolveOptions(options);
  const snippets = await listSnippets();

  const { errors, warnings } = validateSnippet(input, snippets);
  if (errors.length > 0) return { ok: false, errors, warnings };

  const timestamp = now();
  const snippet: Snippet = { id: newId(), ...normalize(input), createdAt: timestamp, updatedAt: timestamp };
  await snippetsItem.setValue([...snippets, snippet]);
  return { ok: true, snippet, warnings };
}

export async function updateSnippet(
  id: string,
  input: SnippetInput,
  options: StoreOptions = {},
): Promise<SaveResult> {
  const { now } = resolveOptions(options);
  const snippets = await listSnippets();
  const index = snippets.findIndex((snippet) => snippet.id === id);
  const current = snippets[index];
  if (!current) {
    return {
      ok: false,
      errors: [{ field: 'general', message: 'Este snippet não existe mais (pode ter sido apagado em outra aba).' }],
      warnings: [],
    };
  }

  const { errors, warnings } = validateSnippet(input, snippets, id);
  if (errors.length > 0) return { ok: false, errors, warnings };

  const updated: Snippet = { ...current, ...normalize(input), updatedAt: now() };
  const next = [...snippets];
  next[index] = updated;
  await snippetsItem.setValue(next);
  return { ok: true, snippet: updated, warnings };
}

export async function deleteSnippet(id: string): Promise<void> {
  const snippets = await listSnippets();
  await snippetsItem.setValue(snippets.filter((snippet) => snippet.id !== id));
}

/**
 * Chama `callback` sempre que a lista mudar (em qualquer aba ou parte da
 * extensão). Devolve a função que para de acompanhar.
 */
export function watchSnippets(callback: (snippets: Snippet[]) => void): () => void {
  return snippetsItem.watch((snippets) => callback(snippets));
}

export async function exportBackup(now: Date = new Date()): Promise<BackupFile> {
  return createBackup(await listSnippets(), now);
}

export async function importBackup(
  items: readonly ImportedSnippet[],
  mode: ImportMode,
  options: StoreOptions = {},
): Promise<ImportReport> {
  const { now, newId } = resolveOptions(options);
  const { snippets, report } = planImport(await listSnippets(), items, mode, { now: now(), newId });
  await snippetsItem.setValue(snippets);
  return report;
}
