// Especificação: aviso discreto na página quando a expansão teve erros.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RenderError } from '@/engine';
import { showErrorToast } from '@/content/toast';

const error = (message: string): RenderError => ({
  kind: 'runtime',
  message,
  span: { start: 0, end: 1 },
  line: 1,
  column: 1,
});

afterEach(() => {
  vi.useRealTimers();
  document.querySelectorAll('atalho-toast').forEach((node) => node.remove());
});

describe('showErrorToast', () => {
  it('mostra o atalho, a quantidade e as mensagens', () => {
    const { root } = showErrorToast(document, '/sig', [error('{site}: nenhum elemento')]);
    expect(root.textContent).toContain('/sig');
    expect(root.textContent).toContain('1 erro');
    expect(root.textContent).toContain('{site}: nenhum elemento');
  });

  it('fica isolado num Shadow DOM, com papel de aviso acessível', () => {
    const { root } = showErrorToast(document, '/sig', [error('x')]);
    expect(root.host.tagName).toBe('ATALHO-TOAST');
    expect(root.querySelector('[role="status"]')).not.toBeNull();
  });

  it('mostra no máximo 3 mensagens e resume o resto', () => {
    const errors = ['a', 'b', 'c', 'd', 'e'].map(error);
    const { root } = showErrorToast(document, '/x', errors);
    expect(root.querySelectorAll('li')).toHaveLength(3);
    expect(root.textContent).toContain('5 erros');
    expect(root.textContent).toContain('e mais 2');
  });

  it('mensagens entram como texto (nunca como HTML)', () => {
    const { root } = showErrorToast(document, '/x', [error('<img src=x onerror=alert(1)>')]);
    expect(root.querySelector('img')).toBeNull();
    expect(root.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('um aviso novo substitui o anterior', () => {
    showErrorToast(document, '/a', [error('a')]);
    showErrorToast(document, '/b', [error('b')]);
    expect(document.querySelectorAll('atalho-toast')).toHaveLength(1);
  });

  it('o botão fechar remove o aviso', () => {
    const { root } = showErrorToast(document, '/a', [error('a')]);
    (root.querySelector('button') as HTMLButtonElement).click();
    expect(document.querySelector('atalho-toast')).toBeNull();
  });

  it('some sozinho depois do tempo definido', () => {
    vi.useFakeTimers();
    showErrorToast(document, '/a', [error('a')], { durationMs: 1000 });
    vi.advanceTimersByTime(999);
    expect(document.querySelector('atalho-toast')).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(document.querySelector('atalho-toast')).toBeNull();
  });
});
