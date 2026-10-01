// Especificação: leitura do clipboard dentro do documento offscreen.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readViaPaste } from '@/offscreen/read-via-paste';

/** O jsdom não implementa execCommand; trocamos por um falso em cada teste. */
function mockExecCommand(implementation: (command: string) => boolean): void {
  Object.defineProperty(document, 'execCommand', {
    value: vi.fn(implementation),
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('readViaPaste', () => {
  it('cola numa textarea temporária e devolve o texto', () => {
    mockExecCommand((command) => {
      // Simula o navegador colando no elemento focado.
      if (command === 'paste') (document.activeElement as HTMLTextAreaElement).value = 'colado!';
      return true;
    });
    expect(readViaPaste(document)).toEqual({ ok: true, text: 'colado!' });
  });

  it('remove a textarea temporária depois', () => {
    mockExecCommand(() => true);
    readViaPaste(document);
    expect(document.querySelectorAll('textarea')).toHaveLength(0);
  });

  it('navegador recusando o "colar" vira resposta de erro', () => {
    mockExecCommand(() => false);
    const response = readViaPaste(document);
    expect(response.ok).toBe(false);
    expect(response).toMatchObject({ error: expect.stringContaining('recusou') as unknown });
  });

  it('exceção vira resposta de erro (nunca lança)', () => {
    mockExecCommand(() => {
      throw new Error('quebrou');
    });
    expect(readViaPaste(document)).toEqual({ ok: false, error: 'quebrou' });
  });
});
