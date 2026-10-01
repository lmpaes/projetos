// Especificação: trocar o atalho pelo texto do snippet, em cada tipo de campo.
import { act, createElement, useState, type ChangeEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { replaceBeforeCaret, waitForSelectionSync } from '@/content/insert';
import { caretAtEnd, editable, input, mockExecCommand, resetDom, textarea, textUntilCaret } from './dom';

afterEach(resetDom);

/** Registra os eventos que o campo recebeu, para conferir que avisamos a página. */
function recordEvents(element: Element): string[] {
  const events: string[] = [];
  element.addEventListener('input', (event) => events.push(`input:${(event as InputEvent).inputType}`));
  element.addEventListener('change', () => events.push('change'));
  return events;
}

describe('input e textarea', () => {
  it('sem execCommand (plano B): troca o atalho, posiciona o cursor e avisa a página', async () => {
    const element = textarea('Oi /sig!', 7);
    const events = recordEvents(element);

    expect(await replaceBeforeCaret({ kind: 'text-control', element }, 4, 'Att, Leo')).toBe('fallback');
    expect(element.value).toBe('Oi Att, Leo!');
    expect([element.selectionStart, element.selectionEnd]).toEqual([11, 11]);
    expect(events).toEqual(['input:insertText', 'change']);
  });

  it('com execCommand (caminho principal): seleciona o atalho e manda "insertText"', async () => {
    const element = textarea('Oi /sig!', 7);
    const calls: Array<{ command: string; value: string; selected: string }> = [];
    mockExecCommand((command, _showUI, value) => {
      calls.push({ command, value, selected: element.value.slice(element.selectionStart, element.selectionEnd) });
      element.setRangeText(value, element.selectionStart, element.selectionEnd, 'end'); // simula o navegador
      return true;
    });

    expect(await replaceBeforeCaret({ kind: 'text-control', element }, 4, 'Att, Leo')).toBe('execCommand');
    expect(calls).toEqual([{ command: 'insertText', value: 'Att, Leo', selected: '/sig' }]);
    expect(element.value).toBe('Oi Att, Leo!');
  });

  it('se o execCommand recusar, usa o plano B', async () => {
    const element = textarea('Oi /sig');
    mockExecCommand(() => false);
    expect(await replaceBeforeCaret({ kind: 'text-control', element }, 4, 'Att, Leo')).toBe('fallback');
    expect(element.value).toBe('Oi Att, Leo');
  });

  it('textarea mantém as quebras de linha', async () => {
    const element = textarea('/sig');
    await replaceBeforeCaret({ kind: 'text-control', element }, 4, 'Att,\nLeo');
    expect(element.value).toBe('Att,\nLeo');
  });

  it('input de uma linha troca quebras de linha por espaço', async () => {
    const element = input('text', 'a /sig');
    await replaceBeforeCaret({ kind: 'text-control', element }, 4, 'Linha 1\nLinha 2');
    expect(element.value).toBe('a Linha 1 Linha 2');
  });

  it('input de e-mail (sem API de seleção) também funciona', async () => {
    const element = input('email', 'eu/em');
    await replaceBeforeCaret({ kind: 'text-control', element }, 3, '@exemplo.com');
    expect(element.value).toBe('eu@exemplo.com');
  });
});

describe('input controlado por React', () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

  /** Roda `fn` dentro do act() do React e espera ele terminar de atualizar a tela. */
  const actAndWait = (fn: () => void): Promise<void> =>
    act(() => {
      fn();
      return Promise.resolve();
    });

  /** Monta <input value={estado} onChange={...}> de verdade, com React 19. */
  async function mountControlledInput() {
    const onValue = vi.fn<(value: string) => void>();
    function Controlled() {
      const [value, setValue] = useState('');
      return createElement('input', {
        value,
        onChange: (event: ChangeEvent<HTMLInputElement>) => {
          setValue(event.target.value);
          onValue(event.target.value);
        },
      });
    }
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    await actAndWait(() => root.render(createElement(Controlled)));
    const element = container.querySelector('input') as HTMLInputElement;
    return {
      element,
      onValue,
      unmount: () => actAndWait(() => root.unmount()),
    };
  }

  /** Simula o usuário digitando (o navegador muda o valor "por baixo" e dispara input). */
  async function typeLikeUser(element: HTMLInputElement, text: string) {
    await actAndWait(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(element, element.value + text);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  it('o React recebe o texto expandido (setter nativo + evento input)', async () => {
    const { element, onValue, unmount } = await mountControlledInput();
    await typeLikeUser(element, 'Oi /sig');
    expect(onValue).toHaveBeenLastCalledWith('Oi /sig');

    await actAndWait(() => void replaceBeforeCaret({ kind: 'text-control', element }, 4, 'Att, Leo'));

    expect(onValue).toHaveBeenLastCalledWith('Oi Att, Leo');
    expect(element.value).toBe('Oi Att, Leo');
    await unmount();
  });

  it('por que o setter nativo? Atribuir element.value direto o React ignora', async () => {
    const { element, onValue, unmount } = await mountControlledInput();
    await typeLikeUser(element, 'Oi');
    await actAndWait(() => {
      element.value = 'valor trocado sem avisar o React';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(onValue).not.toHaveBeenCalledWith('valor trocado sem avisar o React');
    await unmount();
  });
});

describe('contenteditable (ex.: Gmail)', () => {
  it('plano B: troca o atalho, quebra linhas com <br> e deixa o cursor no fim', async () => {
    const host = editable('Olá /sig');
    caretAtEnd(host);
    const events = recordEvents(host);

    expect(await replaceBeforeCaret({ kind: 'contenteditable', element: host }, 4, 'Att,\nLeo')).toBe('fallback');
    expect(host.innerHTML).toBe('Olá Att,<br>Leo');
    expect(textUntilCaret(host)).toBe('Olá Att,Leo');
    expect(events).toEqual(['input:insertText']);
  });

  it('atalho quebrado em formatação ("Olá <b>/s</b>ig")', async () => {
    const host = editable('Olá <b>/s</b>ig');
    caretAtEnd(host);
    await replaceBeforeCaret({ kind: 'contenteditable', element: host }, 4, 'Att, Leo');
    expect(host.textContent).toBe('Olá Att, Leo');
  });

  it('texto do snippet entra como TEXTO, nunca como HTML', async () => {
    const host = editable('/sig');
    caretAtEnd(host);
    await replaceBeforeCaret({ kind: 'contenteditable', element: host }, 4, '<img src=x onerror=alert(1)>');
    expect(host.querySelector('img')).toBeNull();
    expect(host.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('com execCommand: seleciona o atalho e manda "insertText"', async () => {
    const host = editable('Olá /sig');
    caretAtEnd(host);
    const selected: string[] = [];
    const exec = mockExecCommand(() => {
      selected.push(document.getSelection()?.toString() ?? '');
      return true;
    });
    expect(await replaceBeforeCaret({ kind: 'contenteditable', element: host }, 4, 'Att, Leo')).toBe('execCommand');
    expect(exec).toHaveBeenCalledWith('insertText', false, 'Att, Leo');
    expect(selected).toEqual(['/sig']);
  });
});

describe('editores com modelo próprio (ex.: Zendesk/CKEditor 5)', () => {
  /** Editor falso que, como o CKEditor 5, só aceita texto pela colagem (paste). */
  function fakeRichEditor(html: string, { handlesPaste = true } = {}) {
    const host = editable(html);
    host.classList.add('ck-editor__editable');
    const pasted: Array<{ text: string; html: string }> = [];
    host.addEventListener('paste', (event) => {
      if (!handlesPaste) return;
      event.preventDefault();
      const data = (event).clipboardData;
      const text = data?.getData('text/plain') ?? '';
      pasted.push({ text, html: data?.getData('text/html') ?? '' });
      const range = document.getSelection()?.getRangeAt(0);
      range?.deleteContents();
      range?.insertNode(document.createTextNode(text));
    });
    return { host, pasted };
  }

  it('insere por "colagem" sintética, substituindo o atalho', async () => {
    const { host, pasted } = fakeRichEditor('Oi /atd');
    caretAtEnd(host);
    expect(await replaceBeforeCaret({ kind: 'contenteditable', element: host }, 4, 'Olá, tudo bem?')).toBe('paste');
    expect(host.textContent).toBe('Oi Olá, tudo bem?');
    expect(pasted.map((p) => p.text)).toEqual(['Olá, tudo bem?']);
  });

  it('a colagem leva só texto puro (nunca HTML)', async () => {
    const { host, pasted } = fakeRichEditor('/atd');
    caretAtEnd(host);
    await replaceBeforeCaret({ kind: 'contenteditable', element: host }, 4, '<b>negrito?</b>');
    expect(pasted).toEqual([{ text: '<b>negrito?</b>', html: '' }]);
  });

  it('se o editor não tratar a colagem, segue o caminho normal', async () => {
    const { host } = fakeRichEditor('Oi /atd', { handlesPaste: false });
    caretAtEnd(host);
    expect(await replaceBeforeCaret({ kind: 'contenteditable', element: host }, 4, 'Olá')).toBe('fallback');
    expect(host.textContent).toBe('Oi Olá');
  });

  it('contenteditable comum (ex.: Gmail) continua no caminho de sempre, sem colagem', async () => {
    const host = editable('Oi /atd');
    caretAtEnd(host);
    const onPaste = vi.fn();
    host.addEventListener('paste', onPaste);
    expect(await replaceBeforeCaret({ kind: 'contenteditable', element: host }, 4, 'Olá')).toBe('fallback');
    expect(onPaste).not.toHaveBeenCalled();
  });
});

describe('waitForSelectionSync', () => {
  it('termina quando a página avisa que a seleção mudou', async () => {
    const waiting = waitForSelectionSync(document, 10_000);
    document.dispatchEvent(new Event('selectionchange'));
    await expect(waiting).resolves.toBeUndefined();
  });

  it('sem aviso, termina sozinho depois do tempo limite', async () => {
    vi.useFakeTimers();
    const waiting = waitForSelectionSync(document, 50);
    vi.advanceTimersByTime(50);
    await expect(waiting).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});
