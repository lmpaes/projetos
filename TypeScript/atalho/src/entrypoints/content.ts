import { defineContentScript } from 'wxt/utils/define-content-script';
import { readClipboard } from '@/content/clipboard';
import { createDiagnosticLog } from '@/content/diagnostics';
import { attachExpander } from '@/content/expander';
import { createMatcher } from '@/content/matcher';
import { createPageProvider, trackSelection } from '@/content/page-context';
import { showErrorToast } from '@/content/toast';
import { createDefaultEngine, renderTemplate } from '@/engine';
import { debugModeItem } from '@/storage/settings';
import { listSnippets, watchSnippets } from '@/storage/snippets';

// Content script: código que o Chrome injeta em cada página visitada.
// Roda num "mundo isolado": enxerga o DOM da página, mas não as variáveis
// JavaScript dela (e a página também não enxerga as nossas).
export default defineContentScript({
  // Um expansor de texto precisa funcionar em qualquer site.
  matches: ['<all_urls>'],
  // Também roda dentro de iframes (vários editores de texto ricos usam iframe)...
  allFrames: true,
  // ...inclusive iframes "about:blank", comuns em editores como o TinyMCE.
  matchAboutBlank: true,
  matchOriginAsFallback: true,

  async main(ctx) {
    const engine = createDefaultEngine();

    // Modo diagnóstico: liga/desliga pelo dashboard, vale na hora.
    let debugEnabled = await debugModeItem.getValue();
    const unwatchDebug = debugModeItem.watch((enabled) => {
      debugEnabled = enabled;
    });
    const log = createDiagnosticLog(() => debugEnabled);

    // Snippets em memória; atualizados sempre que o dashboard salvar algo.
    const snippets = await listSnippets();
    let matcher = createMatcher(snippets);
    const unwatch = watchSnippets((updated) => {
      matcher = createMatcher(updated);
      log('lista de snippets atualizada', { quantidade: updated.length });
    });
    log('content script carregado', {
      url: location.href,
      frame: window === window.top ? 'página principal' : 'iframe',
      snippets: snippets.length,
    });

    // Lembra a última seleção feita na página (para o {site: selection}).
    const selectionTracker = trackSelection(document);

    const detach = attachExpander(document, {
      getMatcher: () => matcher,
      render: (content) =>
        renderTemplate(content, engine, {
          page: createPageProvider(window, selectionTracker),
          clipboard: () => readClipboard(),
          now: () => new Date(),
        }),
      onErrors: (errors, snippet) => showErrorToast(document, snippet.shortcut, errors),
      log,
    });

    // Quando a extensão é atualizada/recarregada, este script "antigo" para de valer.
    ctx.onInvalidated(() => {
      detach();
      unwatch();
      unwatchDebug();
      selectionTracker.dispose();
    });
  },
});
