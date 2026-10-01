// Especificação: o dashboard inteiro, montado com o HTML REAL da options page
// e o storage em memória (fakeBrowser).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { initDashboard, type DashboardDeps, type DashboardHandle } from '@/dashboard/dashboard';
import { createDefaultEngine } from '@/engine';
import { serializeBackup, createBackup } from '@/storage/backup';
import {
  createSnippet,
  deleteSnippet,
  exportBackup,
  importBackup,
  listSnippets,
  updateSnippet,
  watchSnippets,
} from '@/storage/snippets';
import { input as snippetInput, snippet } from '../storage/fixtures';

// Só o <body> do index.html (o <script> dele não roda quando inserido assim).
// Os testes rodam a partir da pasta do projeto (TypeScript/atalho).
const OPTIONS_HTML = readFileSync(resolve(process.cwd(), 'src/entrypoints/options/index.html'), 'utf8');
const BODY = /<body>([\s\S]*)<\/body>/.exec(OPTIONS_HTML)?.[1] ?? '';

let handle: DashboardHandle | null = null;

beforeEach(() => {
  fakeBrowser.reset();
});
afterEach(() => {
  handle?.dispose();
  handle = null;
  document.body.innerHTML = '';
});

async function mount(overrides: Partial<DashboardDeps> = {}) {
  document.body.innerHTML = BODY;
  const confirm = vi.fn<(message: string) => boolean>(() => true);
  const download = vi.fn<(filename: string, text: string) => void>();
  handle = await initDashboard(document, {
    store: {
      list: listSnippets,
      create: createSnippet,
      update: updateSnippet,
      remove: deleteSnippet,
      watch: watchSnippets,
      exportBackup: () => exportBackup(new Date(2026, 9, 1)),
      importBackup,
    },
    engine: createDefaultEngine(),
    confirm,
    download,
    now: () => new Date(2026, 9, 1, 14, 30),
    previewDelayMs: 0,
    ...overrides,
  });
  return { confirm, download };
}

// --- Atalhos para mexer na tela -------------------------------------------
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const field = (id: string) => $<HTMLInputElement>(id);
function type(id: string, value: string) {
  const element = field(id);
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
}
const click = (id: string) => $(id).click();
const submit = () => $<HTMLFormElement>('snippet-form').requestSubmit();
const listTexts = () => [...document.querySelectorAll('#snippet-list li')].map((li) => li.textContent?.trim());
const clickSnippet = (name: string) =>
  [...document.querySelectorAll<HTMLButtonElement>('#snippet-list button')]
    .find((button) => button.textContent?.includes(name))
    ?.click();
const text = (id: string) => $(id).textContent ?? '';

describe('lista', () => {
  it('sem snippets: mensagem de lista vazia e editor de snippet novo', async () => {
    await mount();
    expect($('empty-list').hidden).toBe(false);
    expect(text('editor-title')).toBe('Novo snippet');
    expect($('delete-button').hidden).toBe(true);
  });

  it('lista em ordem de nome e já abre o primeiro', async () => {
    await createSnippet(snippetInput({ name: 'Zeta', shortcut: '/z' }));
    await createSnippet(snippetInput({ name: 'Alfa', shortcut: '/a' }));
    await mount();
    expect(listTexts()).toEqual([expect.stringContaining('Alfa'), expect.stringContaining('Zeta')]);
    expect(field('name').value).toBe('Alfa');
    expect(text('editor-title')).toBe('Editar snippet');
  });

  it('busca filtra a lista (sem ligar para acentos)', async () => {
    await createSnippet(snippetInput({ name: 'Olá', shortcut: '/ola' }));
    await createSnippet(snippetInput({ name: 'Assinatura', shortcut: '/sig' }));
    await mount();
    type('search', 'ola');
    expect(listTexts()).toEqual([expect.stringContaining('Olá')]);
    type('search', 'nada disso');
    expect(listTexts()).toEqual([]);
    expect(text('empty-list')).toContain('Nenhum snippet encontrado');
  });

  it('mudanças feitas em outra aba aparecem sozinhas', async () => {
    await mount();
    await createSnippet(snippetInput({ name: 'De outra aba', shortcut: '/outra' }));
    await vi.waitFor(() => expect(listTexts()).toEqual([expect.stringContaining('De outra aba')]));
  });

  it('nome e atalho aparecem como texto, nunca como HTML', async () => {
    await createSnippet(snippetInput({ name: '<img src=x onerror=alert(1)>', shortcut: '/xss' }));
    await mount();
    expect(document.querySelector('#snippet-list img')).toBeNull();
    expect(listTexts()[0]).toContain('<img src=x onerror=alert(1)>');
  });
});

describe('criar, editar e excluir', () => {
  it('cria um snippet', async () => {
    await mount();
    click('new-button');
    type('name', 'Assinatura');
    type('shortcut', '/sig');
    type('content', 'Att, Leo');
    submit();
    await vi.waitFor(() => expect(listTexts()).toEqual([expect.stringContaining('Assinatura')]));
    expect(text('status')).toContain('Snippet salvo');
    expect((await listSnippets()).map((s) => s.shortcut)).toEqual(['/sig']);
    expect(text('editor-title')).toBe('Editar snippet');
  });

  it('edita o snippet selecionado', async () => {
    await createSnippet(snippetInput({ name: 'Assinatura', shortcut: '/sig', content: 'Att' }));
    await mount();
    type('content', 'Atenciosamente, Leo');
    submit();
    await vi.waitFor(async () => expect((await listSnippets())[0]?.content).toBe('Atenciosamente, Leo'));
    expect(await listSnippets()).toHaveLength(1);
  });

  it('Ctrl+S salva', async () => {
    await createSnippet(snippetInput({ name: 'A', shortcut: '/a', content: 'x' }));
    await mount();
    type('content', 'novo');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true }));
    await vi.waitFor(async () => expect((await listSnippets())[0]?.content).toBe('novo'));
  });

  it('exclui com confirmação', async () => {
    await createSnippet(snippetInput({ name: 'Assinatura', shortcut: '/sig' }));
    const { confirm } = await mount();
    click('delete-button');
    await vi.waitFor(async () => expect(await listSnippets()).toEqual([]));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('Assinatura'));
    expect(text('editor-title')).toBe('Novo snippet');
  });

  it('não exclui se o usuário cancelar', async () => {
    await createSnippet(snippetInput({ shortcut: '/sig' }));
    await mount({ confirm: () => false });
    click('delete-button');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(await listSnippets()).toHaveLength(1);
  });
});

describe('validação no formulário', () => {
  it('não mostra erros antes de o usuário mexer nos campos', async () => {
    await mount();
    expect(text('name-messages')).toBe('');
    expect(text('shortcut-messages')).toBe('');
  });

  it('salvar vazio mostra os erros de todos os campos e não salva', async () => {
    await mount();
    submit();
    await vi.waitFor(() => expect(text('name-messages')).toContain('Dê um nome'));
    expect(text('shortcut-messages')).toContain('obrigatório');
    expect(text('content-messages')).toContain('vazio');
    expect(await listSnippets()).toEqual([]);
  });

  it('atalho duplicado: erro na hora e botão Salvar desabilitado', async () => {
    await createSnippet(snippetInput({ name: 'Assinatura', shortcut: '/sig' }));
    await mount();
    click('new-button');
    type('shortcut', '/sig');
    expect(text('shortcut-messages')).toContain('Já existe');
    expect($<HTMLButtonElement>('save-button').disabled).toBe(true);
  });

  it('conflito de prefixo: só um aviso (dá para salvar)', async () => {
    await createSnippet(snippetInput({ name: 'Saudação', shortcut: '/s' }));
    await mount();
    click('new-button');
    type('shortcut', '/sig');
    expect($('shortcut-messages').querySelector('.warning')?.textContent).toContain('/s');
    expect($<HTMLButtonElement>('save-button').disabled).toBe(false);
  });
});

describe('alterações não salvas', () => {
  it('trocar de snippet com alterações pergunta antes; cancelar mantém a edição', async () => {
    await createSnippet(snippetInput({ name: 'Alfa', shortcut: '/a' }));
    await createSnippet(snippetInput({ name: 'Beta', shortcut: '/b' }));
    const confirm = vi.fn(() => false);
    await mount({ confirm });
    type('name', 'Alfa editado');
    clickSnippet('Beta');
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('alterações'));
    expect(field('name').value).toBe('Alfa editado');
  });

  it('sem alterações, troca direto', async () => {
    await createSnippet(snippetInput({ name: 'Alfa', shortcut: '/a' }));
    await createSnippet(snippetInput({ name: 'Beta', shortcut: '/b' }));
    const { confirm } = await mount();
    clickSnippet('Beta');
    expect(confirm).not.toHaveBeenCalled();
    expect(field('name').value).toBe('Beta');
  });

  it('fechar a aba com alterações pede confirmação do navegador', async () => {
    await mount();
    type('name', 'algo');
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});

describe('preview ao vivo', () => {
  it('mostra o snippet renderizado com a página de teste', async () => {
    await mount();
    type('content', 'Pedido {=extractregex({site: query}, "id=([^&]+)")} de {site: text; selector=.nome}');
    await vi.waitFor(() => expect(text('preview-output')).toBe('Pedido 123 de Maria Silva'));
  });

  it('mostra os erros com linha e coluna', async () => {
    await mount();
    type('content', 'a {site: URL}');
    await vi.waitFor(() => expect(text('preview-errors')).toContain('Linha 1, coluna 10'));
    expect(text('preview-errors')).toContain("'URL'");
  });

  it('mudar a página de teste atualiza o preview', async () => {
    await mount();
    type('content', '{site: domain}');
    await vi.waitFor(() => expect(text('preview-output')).toBe('exemplo.com'));
    type('test-url', 'https://outro.com.br/x');
    await vi.waitFor(() => expect(text('preview-output')).toBe('outro.com.br'));
  });

  it('o HTML de teste serve para testar seletores', async () => {
    await mount();
    type('test-html', '<p class="destaque">funcionou</p>');
    type('content', '{site: text; selector=.destaque}');
    await vi.waitFor(() => expect(text('preview-output')).toBe('funcionou'));
  });

  it('a página de teste começa preenchida com um exemplo', async () => {
    await mount();
    expect(field('test-url').value).toContain('id=123');
    expect(field('test-html').value).toContain('Maria Silva');
  });
});

describe('backup', () => {
  it('exportar baixa o arquivo JSON com a data no nome', async () => {
    await createSnippet(snippetInput({ shortcut: '/sig' }));
    const { download } = await mount();
    click('export-button');
    await vi.waitFor(() => expect(download).toHaveBeenCalledTimes(1));
    const [filename, content] = download.mock.calls[0] ?? [];
    expect(filename).toBe('atalho-backup-2026-10-01.json');
    expect((JSON.parse(content ?? '{}') as { snippets: unknown[] }).snippets).toHaveLength(1);
  });

  /** Simula escolher um arquivo no <input type=file>. */
  function chooseFile(content: string) {
    const fileInput = field('import-file');
    Object.defineProperty(fileInput, 'files', {
      value: [new File([content], 'backup.json', { type: 'application/json' })],
      configurable: true,
    });
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  }

  const backupWith = (...shortcuts: string[]) =>
    serializeBackup(createBackup(shortcuts.map((shortcut) => snippet({ shortcut, name: `Snip ${shortcut}` }))));

  it('importar (mesclar): mostra o resumo, importa e relata o que pulou', async () => {
    await createSnippet(snippetInput({ shortcut: '/sig' }));
    await mount();
    chooseFile(backupWith('/sig', '/novo'));
    await vi.waitFor(() => expect($('import-panel').hidden).toBe(false));
    expect(text('import-summary')).toContain('2 snippets');

    click('import-confirm');
    await vi.waitFor(() => expect(text('import-report')).toContain('1 importado'));
    expect(text('import-report')).toContain('1 pulado');
    expect(text('import-report')).toContain('Já existe');
    expect((await listSnippets()).map((s) => s.shortcut).sort()).toEqual(['/novo', '/sig']);
  });

  it('importar (substituir): pede confirmação e troca tudo', async () => {
    await createSnippet(snippetInput({ shortcut: '/velho' }));
    const { confirm } = await mount();
    chooseFile(backupWith('/novo'));
    await vi.waitFor(() => expect($('import-panel').hidden).toBe(false));
    $<HTMLInputElement>('import-panel').querySelector<HTMLInputElement>('input[value="replace"]')?.click();
    click('import-confirm');
    await vi.waitFor(async () => expect((await listSnippets()).map((s) => s.shortcut)).toEqual(['/novo']));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('Substituir'));
  });

  it('arquivo inválido mostra o motivo e não abre a importação', async () => {
    await mount();
    chooseFile('isso não é json');
    await vi.waitFor(() => expect(text('status')).toContain('não é um JSON válido'));
    expect($('import-panel').hidden).toBe(true);
  });
});
