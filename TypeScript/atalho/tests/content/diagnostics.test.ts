// Especificação: modo diagnóstico (logs no console da página).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDiagnosticLog, describeElement } from '@/content/diagnostics';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('createDiagnosticLog', () => {
  it('desligado: não escreve nada', () => {
    const output = { info: vi.fn() };
    createDiagnosticLog(() => false, output)('atalho encontrado', { atalho: '/atd' });
    expect(output.info).not.toHaveBeenCalled();
  });

  it('ligado: escreve com o prefixo [Atalho] e os detalhes', () => {
    const output = { info: vi.fn() };
    createDiagnosticLog(() => true, output)('atalho encontrado', { atalho: '/atd' });
    expect(output.info).toHaveBeenCalledWith('[Atalho] atalho encontrado', { atalho: '/atd' });
  });

  it('respeita mudanças feitas depois (liga/desliga sem recarregar)', () => {
    const output = { info: vi.fn() };
    let enabled = false;
    const log = createDiagnosticLog(() => enabled, output);
    log('a');
    enabled = true;
    log('b');
    expect(output.info).toHaveBeenCalledTimes(1);
  });
});

describe('describeElement', () => {
  it('tag, id e classes (no máximo 3)', () => {
    document.body.innerHTML = '<textarea id="resposta" class="a b c d"></textarea>';
    expect(describeElement(document.querySelector('textarea'))).toBe('textarea#resposta.a.b.c');
  });

  it('indica o editor rico, quando houver', () => {
    document.body.innerHTML = '<div class="ck-editor__editable" contenteditable="true"></div>';
    expect(describeElement(document.querySelector('div'))).toBe('div.ck-editor__editable [ckeditor5]');
  });

  it('sem elemento', () => {
    expect(describeElement(null)).toBe('(nenhum)');
  });
});
