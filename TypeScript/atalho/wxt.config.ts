import { defineConfig } from 'wxt';

// Configuração do WXT: é daqui que sai o manifest.json final da extensão.
// Documentação: https://wxt.dev/api/config.html
export default defineConfig({
  // Todo o código-fonte fica em src/ (entrypoints em src/entrypoints).
  srcDir: 'src',

  // Desligamos os "auto-imports" do WXT: cada arquivo importa explicitamente
  // o que usa. Fica mais verboso, mas você sempre sabe de onde vem cada função.
  imports: false,

  manifest: {
    name: 'Atalho — expansor de snippets',
    description:
      'Digite um atalho (ex.: /sig) e ele vira o texto do snippet. Projeto de estudo.',
    // Permissões entram conforme as etapas precisarem delas (ver CLAUDE.md).
    permissions: [
      // Guardar os snippets no chrome.storage.local.
      'storage',
      // {clipboard}: ler a área de transferência (no content script e no offscreen).
      'clipboardRead',
      // Documento offscreen: plano B para ler o clipboard quando a página bloqueia.
      'offscreen',
    ],
    // A chave "action" faz o ícone aparecer na barra; o clique abre o dashboard
    // (tratado em src/entrypoints/background.ts).
    action: {
      default_title: 'Abrir o dashboard do Atalho',
    },
  },
});
