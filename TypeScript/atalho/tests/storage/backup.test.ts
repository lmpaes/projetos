// Especificação: exportar/importar snippets em JSON.
import { describe, expect, it } from 'vitest';
import {
  backupFileName,
  createBackup,
  parseBackup,
  planImport,
  serializeBackup,
  type ImportedSnippet,
} from '@/storage/backup';
import { snippet } from './fixtures';

const NOW = new Date('2026-10-01T15:00:00.000Z');

/** Gerador de ids previsível para os testes. */
function idSequence() {
  let next = 1;
  return () => `novo-${next++}`;
}

const validFile = (snippets: unknown[]) => JSON.stringify({ app: 'atalho', version: 1, exportedAt: '2026-10-01', snippets });

describe('exportar', () => {
  it('createBackup monta o arquivo com app, versão, data e snippets', () => {
    const snippets = [snippet({ shortcut: '/sig' })];
    expect(createBackup(snippets, NOW)).toEqual({
      app: 'atalho',
      version: 1,
      exportedAt: '2026-10-01T15:00:00.000Z',
      snippets,
    });
  });

  it('nome do arquivo com a data', () => {
    expect(backupFileName(new Date(2026, 9, 1))).toBe('atalho-backup-2026-10-01.json');
  });

  it('serializa de forma legível e volta igual no parse (ida e volta)', () => {
    const snippets = [snippet({ shortcut: '/sig', content: 'Linha 1\nLinha 2 {site: url}' })];
    const text = serializeBackup(createBackup(snippets, NOW));
    expect(text).toContain('\n  "app": "atalho"');
    const parsed = parseBackup(text);
    expect(parsed).toEqual({
      ok: true,
      snippets: [
        {
          name: snippets[0]?.name,
          shortcut: '/sig',
          content: 'Linha 1\nLinha 2 {site: url}',
          createdAt: 1000,
          updatedAt: 1000,
        },
      ],
    });
  });
});

describe('parseBackup — arquivos inválidos', () => {
  const errorOf = (text: string) => {
    const result = parseBackup(text);
    return result.ok ? null : result.error;
  };

  it('JSON quebrado', () => {
    expect(errorOf('{ isso não é json')).toContain('JSON válido');
  });

  it('JSON que não é objeto', () => {
    expect(errorOf('[1, 2]')).toContain('backup do Atalho');
  });

  it('arquivo de outro programa', () => {
    expect(errorOf(JSON.stringify({ app: 'outro', version: 1, snippets: [] }))).toContain('backup do Atalho');
  });

  it('versão desconhecida', () => {
    expect(errorOf(JSON.stringify({ app: 'atalho', version: 99, snippets: [] }))).toContain('não suportada');
  });

  it('sem a lista de snippets', () => {
    expect(errorOf(JSON.stringify({ app: 'atalho', version: 1 }))).toContain('lista de snippets');
  });

  it('item que não é objeto (aponta o número do item)', () => {
    expect(errorOf(validFile([{ name: 'a', shortcut: '/a', content: 'x' }, 'texto solto']))).toContain('Snippet #2');
  });

  it('campo com tipo errado (aponta item e campo)', () => {
    const error = errorOf(validFile([{ name: 'a', shortcut: 42, content: 'x' }]));
    expect(error).toContain('Snippet #1');
    expect(error).toContain('"shortcut"');
  });

  it('campo faltando', () => {
    expect(errorOf(validFile([{ shortcut: '/a', content: 'x' }]))).toContain('"name"');
  });
});

describe('parseBackup — segurança', () => {
  it('copia só os campos conhecidos (ignora o resto, inclusive __proto__)', () => {
    const text =
      '{"app":"atalho","version":1,"snippets":[{"name":"a","shortcut":"/a","content":"x","extra":1,"__proto__":{"hack":true}}]}';
    const result = parseBackup(text);
    expect(result).toEqual({ ok: true, snippets: [{ name: 'a', shortcut: '/a', content: 'x' }] });
    expect(({} as Record<string, unknown>).hack).toBeUndefined();
  });

  it('datas inválidas são descartadas', () => {
    const result = parseBackup(validFile([{ name: 'a', shortcut: '/a', content: 'x', createdAt: 'ontem' }]));
    expect(result).toEqual({ ok: true, snippets: [{ name: 'a', shortcut: '/a', content: 'x' }] });
  });
});

describe('planImport', () => {
  const existing = [snippet({ id: 'velho', name: 'Assinatura', shortcut: '/sig' })];
  const incoming: ImportedSnippet[] = [
    { name: 'Assinatura nova', shortcut: '/sig', content: 'outra' },
    { name: 'Endereço', shortcut: '/end', content: 'Rua X', createdAt: 500, updatedAt: 600 },
  ];

  it('mesclar: mantém os atuais, pula atalhos repetidos e explica o motivo', () => {
    const { snippets, report } = planImport(existing, incoming, 'merge', { now: 9000, newId: idSequence() });
    expect(snippets.map((s) => s.shortcut)).toEqual(['/sig', '/end']);
    expect(snippets[0]?.id).toBe('velho');
    expect(report.imported).toBe(1);
    expect(report.skipped).toEqual([
      { name: 'Assinatura nova', shortcut: '/sig', reason: expect.stringContaining('Já existe') as unknown },
    ]);
  });

  it('importados ganham id novo e mantêm as datas do arquivo', () => {
    const { snippets } = planImport(existing, incoming, 'merge', { now: 9000, newId: idSequence() });
    expect(snippets[1]).toEqual({
      id: 'novo-1',
      name: 'Endereço',
      shortcut: '/end',
      content: 'Rua X',
      createdAt: 500,
      updatedAt: 600,
    });
  });

  it('sem datas no arquivo, usa a hora atual', () => {
    const { snippets } = planImport([], [{ name: 'a', shortcut: '/a', content: 'x' }], 'merge', {
      now: 9000,
      newId: idSequence(),
    });
    expect(snippets[0]).toMatchObject({ createdAt: 9000, updatedAt: 9000 });
  });

  it('substituir: descarta os atuais e usa só o arquivo', () => {
    const { snippets, report } = planImport(existing, incoming, 'replace', { now: 9000, newId: idSequence() });
    expect(snippets.map((s) => s.name)).toEqual(['Assinatura nova', 'Endereço']);
    expect(report).toEqual({ imported: 2, skipped: [] });
  });

  it('atalho repetido dentro do próprio arquivo: fica o primeiro', () => {
    const duplicated: ImportedSnippet[] = [
      { name: 'Primeiro', shortcut: '/x', content: '1' },
      { name: 'Segundo', shortcut: '/x', content: '2' },
    ];
    const { snippets, report } = planImport([], duplicated, 'replace', { now: 1, newId: idSequence() });
    expect(snippets.map((s) => s.name)).toEqual(['Primeiro']);
    expect(report.skipped.map((s) => s.name)).toEqual(['Segundo']);
  });

  it('itens inválidos são pulados com o motivo', () => {
    const { report } = planImport([], [{ name: 'Sem atalho', shortcut: '', content: 'x' }], 'merge', {
      now: 1,
      newId: idSequence(),
    });
    expect(report.imported).toBe(0);
    expect(report.skipped[0]?.reason).toContain('obrigatório');
  });

  it('apara espaços de nome e atalho ao importar', () => {
    const { snippets } = planImport([], [{ name: ' A ', shortcut: ' /a ', content: 'x' }], 'merge', {
      now: 1,
      newId: idSequence(),
    });
    expect(snippets[0]).toMatchObject({ name: 'A', shortcut: '/a' });
  });
});
