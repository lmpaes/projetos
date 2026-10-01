import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

export default defineConfig({
  // O plugin do WXT troca as APIs "browser"/"chrome" por um navegador falso
  // em memória (fakeBrowser). Assim os testes de storage não precisam do Chrome.
  plugins: [WxtVitest()],
  test: {
    // jsdom simula document, window, Range, Selection... dentro do Node.
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    // Completa o que falta no jsdom (ex.: DataTransfer). Ver tests/setup.ts.
    setupFiles: ['tests/setup.ts'],
    // Desfaz mocks entre testes para um teste não "vazar" no outro.
    restoreMocks: true,
  },
});
