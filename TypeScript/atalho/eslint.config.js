// Configuração do ESLint (formato "flat config").
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  // Pastas geradas automaticamente: não faz sentido analisar.
  { ignores: ['.output/', '.wxt/', 'node_modules/', 'coverage/'] },

  js.configs.recommended,

  // Regras de TS que usam informação de tipos, por exemplo
  // "no-floating-promises", que avisa quando esquecemos um await.
  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },

  {
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      // Proibições do projeto: nada de executar texto como código.
      // (O MV3 já bloqueia em tempo de execução; aqui bloqueamos no lint.)
      'no-eval': 'error',
      'no-new-func': 'error',
      'no-implied-eval': 'error',
    },
  },

  // Scripts Node (ex.: scripts/check-no-eval.mjs) rodam fora do navegador.
  {
    files: ['scripts/**/*.mjs', '*.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
);
