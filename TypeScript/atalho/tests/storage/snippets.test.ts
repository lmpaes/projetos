// Especificação: CRUD de snippets no chrome.storage.local (navegador falso em memória).
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import {
  createSnippet,
  deleteSnippet,
  exportBackup,
  importBackup,
  listSnippets,
  updateSnippet,
  watchSnippets,
} from '@/storage/snippets';
import { input } from './fixtures';

/** Relógio e ids previsíveis. */
function fixedOptions(start = 1000) {
  let time = start;
  let id = 0;
  return { now: () => time++, newId: () => `id-${++id}` };
}

beforeEach(() => {
  fakeBrowser.reset(); // cada teste começa com o storage vazio
});

describe('criar e listar', () => {
  it('começa vazio', async () => {
    expect(await listSnippets()).toEqual([]);
  });

  it('cria com id, datas e campos aparados', async () => {
    const result = await createSnippet(input({ name: ' Assinatura ', shortcut: ' /sig ' }), fixedOptions());
    expect(result).toEqual({
      ok: true,
      warnings: [],
      snippet: { id: 'id-1', name: 'Assinatura', shortcut: '/sig', content: 'Att, Leo', createdAt: 1000, updatedAt: 1000 },
    });
    expect(await listSnippets()).toEqual([result.ok ? result.snippet : null]);
  });

  it('guarda no chrome.storage.local, na chave "snippets"', async () => {
    await createSnippet(input(), fixedOptions());
    const raw = await fakeBrowser.storage.local.get('snippets');
    expect(raw.snippets).toHaveLength(1);
  });

  it('não salva snippet inválido', async () => {
    const result = await createSnippet(input({ shortcut: '' }), fixedOptions());
    expect(result.ok).toBe(false);
    expect(await listSnippets()).toEqual([]);
  });

  it('não salva atalho duplicado', async () => {
    const options = fixedOptions();
    await createSnippet(input({ shortcut: '/sig' }), options);
    const result = await createSnippet(input({ name: 'Outra', shortcut: '/sig' }), options);
    expect(result).toMatchObject({ ok: false, errors: [{ field: 'shortcut' }] });
    expect(await listSnippets()).toHaveLength(1);
  });

  it('salva com aviso de conflito de prefixo', async () => {
    const options = fixedOptions();
    await createSnippet(input({ shortcut: '/s' }), options);
    const result = await createSnippet(input({ name: 'Assinatura', shortcut: '/sig' }), options);
    expect(result.ok).toBe(true);
    expect(result.warnings).toHaveLength(1);
  });
});

describe('editar e apagar', () => {
  it('editar muda os campos e o updatedAt, mantendo id e createdAt', async () => {
    const options = fixedOptions();
    await createSnippet(input(), options);
    const result = await updateSnippet('id-1', input({ name: 'Assinatura formal', content: 'Atenciosamente' }), options);
    expect(result).toMatchObject({
      ok: true,
      snippet: { id: 'id-1', name: 'Assinatura formal', content: 'Atenciosamente', createdAt: 1000, updatedAt: 1001 },
    });
    expect(await listSnippets()).toHaveLength(1);
  });

  it('editar mantendo o próprio atalho não acusa duplicado', async () => {
    const options = fixedOptions();
    await createSnippet(input({ shortcut: '/sig' }), options);
    expect((await updateSnippet('id-1', input({ shortcut: '/sig' }), options)).ok).toBe(true);
  });

  it('editar para um atalho de outro snippet é bloqueado', async () => {
    const options = fixedOptions();
    await createSnippet(input({ shortcut: '/a' }), options);
    await createSnippet(input({ shortcut: '/b' }), options);
    expect((await updateSnippet('id-2', input({ shortcut: '/a' }), options)).ok).toBe(false);
  });

  it('editar um snippet que não existe', async () => {
    expect(await updateSnippet('fantasma', input(), fixedOptions())).toMatchObject({
      ok: false,
      errors: [{ field: 'general' }],
    });
  });

  it('apagar remove só aquele snippet', async () => {
    const options = fixedOptions();
    await createSnippet(input({ shortcut: '/a' }), options);
    await createSnippet(input({ shortcut: '/b' }), options);
    await deleteSnippet('id-1');
    expect((await listSnippets()).map((s) => s.shortcut)).toEqual(['/b']);
  });

  it('apagar um id inexistente não faz nada', async () => {
    await createSnippet(input(), fixedOptions());
    await deleteSnippet('fantasma');
    expect(await listSnippets()).toHaveLength(1);
  });
});

describe('acompanhar mudanças (usado pelo content script)', () => {
  it('avisa quando a lista muda e para de avisar após unwatch', async () => {
    const callback = vi.fn();
    const unwatch = watchSnippets(callback);
    await createSnippet(input(), fixedOptions());
    await vi.waitFor(() => expect(callback).toHaveBeenCalledTimes(1));
    expect(callback.mock.calls[0]?.[0]).toHaveLength(1);

    unwatch();
    await createSnippet(input({ shortcut: '/outro' }), fixedOptions(5000));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe('backup', () => {
  it('exportBackup traz todos os snippets salvos', async () => {
    await createSnippet(input(), fixedOptions());
    const backup = await exportBackup(new Date('2026-10-01T12:00:00Z'));
    expect(backup).toMatchObject({ app: 'atalho', version: 1, exportedAt: '2026-10-01T12:00:00.000Z' });
    expect(backup.snippets.map((s) => s.shortcut)).toEqual(['/sig']);
  });

  it('importBackup (mesclar) salva e relata', async () => {
    const options = fixedOptions();
    await createSnippet(input({ shortcut: '/sig' }), options);
    const report = await importBackup(
      [
        { name: 'Dup', shortcut: '/sig', content: 'x' },
        { name: 'Novo', shortcut: '/novo', content: 'y' },
      ],
      'merge',
      options,
    );
    expect(report.imported).toBe(1);
    expect(report.skipped).toHaveLength(1);
    expect((await listSnippets()).map((s) => s.shortcut)).toEqual(['/sig', '/novo']);
  });

  it('importBackup (substituir) troca tudo', async () => {
    const options = fixedOptions();
    await createSnippet(input({ shortcut: '/velho' }), options);
    await importBackup([{ name: 'Novo', shortcut: '/novo', content: 'y' }], 'replace', options);
    expect((await listSnippets()).map((s) => s.shortcut)).toEqual(['/novo']);
  });
});
