// Ponto de entrada do dashboard: liga o dashboard às peças reais
// (storage do Chrome, motor de snippets, confirm e download do navegador).
import { initDashboard } from '@/dashboard/dashboard';
import { downloadText } from '@/dashboard/download';
import { createDefaultEngine } from '@/engine';
import {
  createSnippet,
  deleteSnippet,
  exportBackup,
  importBackup,
  listSnippets,
  updateSnippet,
  watchSnippets,
} from '@/storage/snippets';
import { debugModeItem } from '@/storage/settings';

void initDashboard(document, {
  store: {
    list: listSnippets,
    create: (input) => createSnippet(input),
    update: (id, input) => updateSnippet(id, input),
    remove: deleteSnippet,
    watch: watchSnippets,
    exportBackup: () => exportBackup(),
    importBackup: (items, mode) => importBackup(items, mode),
  },
  settings: {
    getDebugMode: () => debugModeItem.getValue(),
    setDebugMode: (enabled) => debugModeItem.setValue(enabled),
  },
  engine: createDefaultEngine(),
  confirm: (message) => window.confirm(message),
  download: (filename, text) => downloadText(document, filename, text),
  now: () => new Date(),
});
