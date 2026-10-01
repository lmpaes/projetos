// Especificação: a implementação REAL do PageProvider (lado do navegador).
import { afterEach, describe, expect, it } from 'vitest';
import { createPageProvider, readableTopWindow, trackSelection } from '@/content/page-context';

afterEach(() => {
  document.body.innerHTML = '';
  document.getSelection()?.removeAllRanges();
});

/** Seleciona todo o conteúdo de um elemento e avisa a página (como o navegador faria). */
function selectContents(element: Element): void {
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = document.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  document.dispatchEvent(new Event('selectionchange'));
}

function clearSelection(): void {
  document.getSelection()?.removeAllRanges();
  document.dispatchEvent(new Event('selectionchange'));
}

describe('createPageProvider', () => {
  it('lê a URL e o documento da janela', () => {
    document.title = 'Página real';
    const page = createPageProvider(window);
    expect(page.url).toBe(window.location.href);
    expect(page.document.title).toBe('Página real');
  });

  it('devolve a seleção atual quando existe', () => {
    document.body.innerHTML = '<p id="p">Texto da página</p>';
    const page = createPageProvider(window);
    selectContents(document.getElementById('p') as Element);
    expect(page.selection()).toBe('Texto da página');
  });
});

describe('trackSelection', () => {
  it('lembra a última seleção depois que o foco vai para um campo', () => {
    document.body.innerHTML = '<p id="p">Nome do cliente</p><textarea id="t"></textarea>';
    const tracker = trackSelection(document);
    const page = createPageProvider(window, tracker);

    selectContents(document.getElementById('p') as Element);
    (document.getElementById('t') as HTMLTextAreaElement).focus();
    clearSelection(); // ao focar o campo, a seleção da página some

    expect(page.selection()).toBe('Nome do cliente');
    tracker.dispose();
  });

  it('ignora seleções feitas dentro de campos editáveis', () => {
    document.body.innerHTML =
      '<p id="p">Fora</p><div id="editor" contenteditable="true">Dentro do editor</div>';
    const tracker = trackSelection(document);

    selectContents(document.getElementById('p') as Element);
    selectContents(document.getElementById('editor') as Element);

    expect(tracker.lastSelection()).toBe('Fora');
    tracker.dispose();
  });

  it('dispose() para de rastrear', () => {
    document.body.innerHTML = '<p id="a">Primeiro</p><p id="b">Segundo</p>';
    const tracker = trackSelection(document);
    selectContents(document.getElementById('a') as Element);
    tracker.dispose();
    selectContents(document.getElementById('b') as Element);
    expect(tracker.lastSelection()).toBe('Primeiro');
  });
});

describe('readableTopWindow', () => {
  it('na janela principal, devolve ela mesma', () => {
    expect(readableTopWindow(window)).toBe(window);
  });

  it('num iframe da mesma origem (ex.: editor em about:blank), devolve a janela principal', () => {
    const iframe = document.createElement('iframe');
    document.body.append(iframe);
    const frameWindow = iframe.contentWindow as Window;
    // Comparamos o documento: no Vitest, `window` é uma cópia da janela do jsdom,
    // então comparar as janelas com toBe daria falso mesmo estando certo.
    expect(readableTopWindow(frameWindow).document).toBe(document);
    expect(readableTopWindow(frameWindow)).not.toBe(frameWindow);
  });

  it('num iframe de outra origem, devolve o próprio frame', () => {
    const blockedTop = {
      get location(): Location {
        throw new DOMException('Blocked a frame with origin', 'SecurityError');
      },
    };
    const crossOriginFrame = { top: blockedTop } as unknown as Window;
    expect(readableTopWindow(crossOriginFrame)).toBe(crossOriginFrame);
  });
});
