import { describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

// Teste de fumaça da etapa 0: garante que Vitest, jsdom e o navegador falso
// do WXT estão configurados. Será substituído pelos testes reais.
describe('ambiente de testes', () => {
  it('tem um DOM (jsdom)', () => {
    document.body.innerHTML = '<p id="x">olá</p>';
    expect(document.querySelector('#x')?.textContent).toBe('olá');
  });

  it('tem chrome.storage falso em memória (fakeBrowser)', async () => {
    await fakeBrowser.storage.local.set({ chave: 'valor' });
    expect(await fakeBrowser.storage.local.get('chave')).toEqual({ chave: 'valor' });
  });
});
