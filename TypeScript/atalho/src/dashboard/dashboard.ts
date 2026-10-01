import type { EngineRegistry } from '@/engine';
import type { Snippet, SnippetInput } from '@/shared/types';
import type { BackupFile, ImportedSnippet, ImportMode, ImportReport } from '@/storage/backup';
import type { SaveResult } from '@/storage/snippets';

/** Tudo o que o dashboard usa "de fora" (injetável para os testes). */
export interface DashboardDeps {
  store: {
    list(): Promise<Snippet[]>;
    create(input: SnippetInput): Promise<SaveResult>;
    update(id: string, input: SnippetInput): Promise<SaveResult>;
    remove(id: string): Promise<void>;
    watch(callback: (snippets: Snippet[]) => void): () => void;
    exportBackup(): Promise<BackupFile>;
    importBackup(items: readonly ImportedSnippet[], mode: ImportMode): Promise<ImportReport>;
  };
  engine: EngineRegistry;
  /** Pergunta sim/não ao usuário (window.confirm no navegador). */
  confirm(message: string): boolean;
  /** Oferece um arquivo para download. */
  download(filename: string, text: string): void;
  now(): Date;
  /** Espera antes de atualizar o preview (ms). Padrão: 150. */
  previewDelayMs?: number;
}

export interface DashboardHandle {
  dispose(): void;
}

/** ETAPA 7 (TDD): ainda não implementado. */
export function initDashboard(doc: Document, deps: DashboardDeps): Promise<DashboardHandle> {
  void doc;
  void deps;
  return Promise.reject(new Error('initDashboard: não implementado (etapa 7)'));
}
