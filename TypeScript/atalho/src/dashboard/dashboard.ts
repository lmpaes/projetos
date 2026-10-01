// =============================================================================
// Dashboard (options page): lista, editor, preview ao vivo e backup.
// -----------------------------------------------------------------------------
// TS puro, sem framework. O "estado" fica em poucas variáveis aqui dentro e os
// valores do formulário ficam nos próprios campos (o DOM é a fonte da verdade
// do que está sendo editado). Toda dependência externa vem por `deps`, o que
// permite testar tudo no jsdom.
// =============================================================================

import { renderTemplate, type EngineRegistry } from '@/engine';
import type { Snippet, SnippetInput } from '@/shared/types';
import {
  backupFileName,
  parseBackup,
  serializeBackup,
  type BackupFile,
  type ImportedSnippet,
  type ImportMode,
  type ImportReport,
} from '@/storage/backup';
import type { SaveResult } from '@/storage/snippets';
import { validateSnippet, type ValidationIssue } from '@/storage/validation';
import { debounce } from './debounce';
import { el, requireElement } from './dom';
import { draftFrom, EMPTY_DRAFT, filterSnippets, isDirty, sortSnippets } from './list';
import { createPreviewContext, DEFAULT_PREVIEW_PAGE, type PreviewPage } from './preview-context';

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

type FormField = 'name' | 'shortcut' | 'content';
const FORM_FIELDS: readonly FormField[] = ['name', 'shortcut', 'content'];
const DISCARD_MESSAGE = 'Você tem alterações não salvas neste snippet. Descartar as alterações?';

export async function initDashboard(doc: Document, deps: DashboardDeps): Promise<DashboardHandle> {
  const ui = findElements(doc);
  // Um AbortController desliga todos os listeners de uma vez no dispose().
  const listeners = new AbortController();
  const on = <K extends keyof HTMLElementEventMap>(
    target: EventTarget,
    type: K,
    handler: (event: HTMLElementEventMap[K]) => void,
  ) => target.addEventListener(type, handler as EventListener, { signal: listeners.signal });

  // --- Estado ------------------------------------------------------------------
  let snippets = sortSnippets(await deps.store.list());
  /** Snippet aberto no editor (null = snippet novo, ainda não salvo). */
  let selectedId: string | null = null;
  /** Como o formulário estava ao abrir/salvar (para saber se há alterações). */
  let baseline: SnippetInput = EMPTY_DRAFT;
  /** Campos em que o usuário já mexeu (só neles mostramos erros). */
  const touched = new Set<FormField>();
  /** Snippets lidos do arquivo, esperando o usuário confirmar a importação. */
  let pendingImport: ImportedSnippet[] | null = null;
  /** Número da versão mais recente do preview (descarta resultados atrasados). */
  let previewTicket = 0;

  const readDraft = (): SnippetInput => ({
    name: ui.name.value,
    shortcut: ui.shortcut.value,
    content: ui.content.value,
  });
  const hasUnsavedChanges = () => isDirty(readDraft(), baseline);
  const selected = () => snippets.find((snippet) => snippet.id === selectedId) ?? null;

  // --- Mensagens ---------------------------------------------------------------
  function setStatus(message: string, kind: 'ok' | 'error' = 'ok') {
    ui.status.textContent = message;
    ui.status.dataset.kind = kind;
  }

  // --- Lista -------------------------------------------------------------------
  function renderList() {
    const visible = filterSnippets(snippets, ui.search.value);
    ui.list.replaceChildren(
      ...visible.map((snippet) =>
        el(
          doc,
          'li',
          {},
          el(
            doc,
            'button',
            {
              type: 'button',
              className: 'snippet-item',
              attrs: { 'aria-current': snippet.id === selectedId ? 'true' : undefined },
              onClick: () => openSnippet(snippet),
            },
            el(doc, 'span', { className: 'snippet-name' }, snippet.name),
            el(doc, 'code', { className: 'snippet-shortcut' }, snippet.shortcut),
          ),
        ),
      ),
    );
    ui.emptyList.hidden = visible.length > 0;
    ui.emptyList.textContent =
      snippets.length === 0
        ? 'Nenhum snippet ainda. Clique em "+ Novo snippet" para criar o primeiro.'
        : `Nenhum snippet encontrado para "${ui.search.value.trim()}".`;
  }

  // --- Editor ------------------------------------------------------------------
  /** Abre um snippet (ou um novo) no editor, perguntando antes se há alterações. */
  function openSnippet(snippet: Snippet | null) {
    if (hasUnsavedChanges() && !deps.confirm(DISCARD_MESSAGE)) return;
    loadIntoEditor(snippet);
  }

  function loadIntoEditor(snippet: Snippet | null) {
    selectedId = snippet?.id ?? null;
    baseline = draftFrom(snippet);
    ui.name.value = baseline.name;
    ui.shortcut.value = baseline.shortcut;
    ui.content.value = baseline.content;
    touched.clear();
    ui.editorTitle.textContent = snippet ? 'Editar snippet' : 'Novo snippet';
    ui.deleteButton.hidden = !snippet;
    renderValidation();
    renderList();
    schedulePreview();
  }

  /** Mostra erros/avisos dos campos já mexidos e decide se o Salvar fica habilitado. */
  function renderValidation(showAll = false) {
    if (showAll) FORM_FIELDS.forEach((field) => touched.add(field));
    const result = validateSnippet(readDraft(), snippets, selectedId ?? undefined);

    for (const field of FORM_FIELDS) {
      const container = ui.messages[field];
      const issues = (list: ValidationIssue[]) => list.filter((issue) => issue.field === field);
      container.replaceChildren(
        ...(touched.has(field)
          ? [
              ...issues(result.errors).map((issue) => el(doc, 'p', { className: 'error' }, issue.message)),
              ...issues(result.warnings).map((issue) => el(doc, 'p', { className: 'warning' }, issue.message)),
            ]
          : []),
      );
    }

    const visibleErrors = result.errors.filter(
      (issue) => issue.field === 'general' || touched.has(issue.field),
    );
    ui.saveButton.disabled = visibleErrors.length > 0;
    return result;
  }

  async function save() {
    const { errors } = renderValidation(true);
    if (errors.length > 0) {
      setStatus('Corrija os campos destacados antes de salvar.', 'error');
      return;
    }

    const draft = readDraft();
    const result = selectedId ? await deps.store.update(selectedId, draft) : await deps.store.create(draft);
    if (!result.ok) {
      setStatus(result.errors[0]?.message ?? 'Não foi possível salvar.', 'error');
      return;
    }

    const saved = result.snippet;
    snippets = sortSnippets([...snippets.filter((snippet) => snippet.id !== saved.id), saved]);
    // Recarrega o editor com o que foi salvo (nome/atalho sem espaços nas pontas).
    loadIntoEditor(saved);
    renderValidation(true); // mantém os avisos (ex.: conflito de prefixo) visíveis
    setStatus(`Snippet salvo: "${saved.name}" (${saved.shortcut}).`);
  }

  async function removeSelected() {
    const current = selected();
    if (!current) return;
    if (!deps.confirm(`Excluir o snippet "${current.name}" (${current.shortcut})? Isso não pode ser desfeito.`)) {
      return;
    }
    await deps.store.remove(current.id);
    snippets = snippets.filter((snippet) => snippet.id !== current.id);
    loadIntoEditor(snippets[0] ?? null);
    setStatus(`Snippet "${current.name}" excluído.`);
  }

  // --- Preview -------------------------------------------------------------------
  const readTestPage = (): PreviewPage => ({
    url: ui.testUrl.value,
    title: ui.testTitle.value,
    html: ui.testHtml.value,
    selection: ui.testSelection.value,
    clipboard: ui.testClipboard.value,
  });

  async function runPreview() {
    const ticket = ++previewTicket;
    const context = createPreviewContext(readTestPage(), () => deps.now());
    const result = await renderTemplate(ui.content.value, deps.engine, context);
    if (ticket !== previewTicket) return; // já existe um preview mais novo a caminho

    ui.previewOutput.textContent = result.text;
    ui.previewErrors.replaceChildren(
      ...result.errors.map((error) =>
        el(
          doc,
          'li',
          { className: error.kind },
          `Linha ${error.line}, coluna ${error.column}: ${error.message}`,
        ),
      ),
    );
  }
  const schedulePreview = debounce(() => void runPreview(), deps.previewDelayMs ?? 150);

  // --- Backup --------------------------------------------------------------------
  async function exportAll() {
    const backup = await deps.store.exportBackup();
    deps.download(backupFileName(deps.now()), serializeBackup(backup));
    setStatus(`Backup exportado com ${plural(backup.snippets.length, 'snippet', 'snippets')}.`);
  }

  async function readImportFile() {
    const file = ui.importFile.files?.[0];
    if (!file) return;
    const parsed = parseBackup(await file.text());
    ui.importFile.value = ''; // permite escolher o mesmo arquivo de novo depois

    if (!parsed.ok) {
      ui.importPanel.hidden = true;
      setStatus(`Não foi possível importar: ${parsed.error}`, 'error');
      return;
    }

    pendingImport = parsed.snippets;
    ui.importSummary.textContent = `O arquivo "${file.name}" tem ${plural(parsed.snippets.length, 'snippet', 'snippets')}.`;
    ui.importReport.replaceChildren();
    ui.mergeOption.checked = true;
    ui.importOptions.disabled = false;
    ui.importConfirm.hidden = false;
    ui.importPanel.hidden = false;
  }

  async function confirmImport() {
    if (!pendingImport) return;
    const mode: ImportMode = ui.replaceOption.checked ? 'replace' : 'merge';
    if (
      mode === 'replace' &&
      !deps.confirm(
        `Substituir TODOS os seus ${plural(snippets.length, 'snippet', 'snippets')} pelos ` +
          `${pendingImport.length} do arquivo? Os atuais serão apagados.`,
      )
    ) {
      return;
    }

    const report = await deps.store.importBackup(pendingImport, mode);
    pendingImport = null;
    ui.importOptions.disabled = true;
    ui.importConfirm.hidden = true;
    ui.importReport.replaceChildren(
      el(
        doc,
        'p',
        {},
        `${plural(report.imported, 'importado', 'importados')}, ${plural(report.skipped.length, 'pulado', 'pulados')}.`,
      ),
      el(
        doc,
        'ul',
        {},
        ...report.skipped.map((item) => el(doc, 'li', {}, `${item.name} (${item.shortcut}): ${item.reason}`)),
      ),
    );

    snippets = sortSnippets(await deps.store.list());
    if (!selected()) loadIntoEditor(snippets[0] ?? null);
    renderList();
    setStatus('Importação concluída.');
  }

  // --- Eventos -------------------------------------------------------------------
  on(ui.form, 'submit', (event) => {
    event.preventDefault();
    void save();
  });
  for (const field of FORM_FIELDS) {
    on(ui[field], 'input', () => {
      touched.add(field);
      renderValidation();
      if (field === 'content') schedulePreview();
    });
  }
  for (const input of [ui.testUrl, ui.testTitle, ui.testHtml, ui.testSelection, ui.testClipboard]) {
    on(input, 'input', () => schedulePreview());
  }
  on(ui.search, 'input', () => renderList());
  on(ui.newButton, 'click', () => openSnippet(null));
  on(ui.deleteButton, 'click', () => void removeSelected());
  on(ui.exportButton, 'click', () => void exportAll());
  on(ui.importButton, 'click', () => ui.importFile.click());
  on(ui.importFile, 'change', () => void readImportFile());
  on(ui.importConfirm, 'click', () => void confirmImport());
  on(ui.importCancel, 'click', () => {
    pendingImport = null;
    ui.importPanel.hidden = true;
  });

  // Ctrl+S (ou Cmd+S no Mac) salva.
  on(doc, 'keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      void save();
    }
  });

  // Fechar a aba com alterações não salvas: o navegador pergunta antes.
  doc.defaultView?.addEventListener(
    'beforeunload',
    (event) => {
      if (hasUnsavedChanges()) event.preventDefault();
    },
    { signal: listeners.signal },
  );

  // Mudanças feitas em outra aba (ou pelo import) chegam aqui.
  const unwatch = deps.store.watch((next) => {
    snippets = sortSnippets(next);
    if (selectedId && !selected() && !hasUnsavedChanges()) loadIntoEditor(snippets[0] ?? null);
    renderList();
    renderValidation();
  });

  // --- Começo ----------------------------------------------------------------------
  ui.testUrl.value = DEFAULT_PREVIEW_PAGE.url;
  ui.testTitle.value = DEFAULT_PREVIEW_PAGE.title;
  ui.testHtml.value = DEFAULT_PREVIEW_PAGE.html;
  ui.testSelection.value = DEFAULT_PREVIEW_PAGE.selection;
  ui.testClipboard.value = DEFAULT_PREVIEW_PAGE.clipboard;
  loadIntoEditor(snippets[0] ?? null);

  return {
    dispose() {
      listeners.abort();
      unwatch();
      schedulePreview.cancel();
    },
  };
}

/** "1 snippet" / "3 snippets". */
function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** Todos os elementos que o dashboard usa (falha cedo se o HTML mudar). */
function findElements(doc: Document) {
  const get = <T extends HTMLElement>(id: string) => requireElement<T>(doc, id);
  const importPanel = get<HTMLElement>('import-panel');
  const radio = (value: ImportMode) => {
    const input = importPanel.querySelector<HTMLInputElement>(`input[name="import-mode"][value="${value}"]`);
    if (!input) throw new Error(`Opção de importação "${value}" não encontrada no HTML`);
    return input;
  };
  return {
    status: get<HTMLElement>('status'),
    exportButton: get<HTMLButtonElement>('export-button'),
    importButton: get<HTMLButtonElement>('import-button'),
    importFile: get<HTMLInputElement>('import-file'),
    importPanel,
    importSummary: get<HTMLElement>('import-summary'),
    importOptions: get<HTMLFieldSetElement>('import-options'),
    importReport: get<HTMLElement>('import-report'),
    importConfirm: get<HTMLButtonElement>('import-confirm'),
    importCancel: get<HTMLButtonElement>('import-cancel'),
    mergeOption: radio('merge'),
    replaceOption: radio('replace'),
    newButton: get<HTMLButtonElement>('new-button'),
    search: get<HTMLInputElement>('search'),
    list: get<HTMLUListElement>('snippet-list'),
    emptyList: get<HTMLElement>('empty-list'),
    editorTitle: get<HTMLElement>('editor-title'),
    form: get<HTMLFormElement>('snippet-form'),
    name: get<HTMLInputElement>('name'),
    shortcut: get<HTMLInputElement>('shortcut'),
    content: get<HTMLTextAreaElement>('content'),
    messages: {
      name: get<HTMLElement>('name-messages'),
      shortcut: get<HTMLElement>('shortcut-messages'),
      content: get<HTMLElement>('content-messages'),
    } satisfies Record<FormField, HTMLElement>,
    saveButton: get<HTMLButtonElement>('save-button'),
    deleteButton: get<HTMLButtonElement>('delete-button'),
    previewOutput: get<HTMLElement>('preview-output'),
    previewErrors: get<HTMLUListElement>('preview-errors'),
    testUrl: get<HTMLInputElement>('test-url'),
    testTitle: get<HTMLInputElement>('test-title'),
    testHtml: get<HTMLTextAreaElement>('test-html'),
    testSelection: get<HTMLInputElement>('test-selection'),
    testClipboard: get<HTMLInputElement>('test-clipboard'),
  };
}
