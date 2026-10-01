// Especificação: trocar o atalho pelo texto do snippet, em cada tipo de campo.
import { act, createElement, useState, type ChangeEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { replaceBeforeCaret } from '@/content/insert';
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
  it('sem execCommand (plano B): troca o atalho, posiciona o cursor e avisa a página', () => {
    const element = textarea('Oi /sig!', 7);
    const events = recordEvents(element);

    expect(replaceBeforeCaret({ kind: 'text-control', element }, 4, 'Att, Leo')).toBe('fallback');
    expect(element.value).toBe('Oi Att, Leo!');
    expect([element.selectionStart, element.selectionEnd]).toEqual([11, 11]);
    expect(events).toEqual(['input:insertText', 'change']);
  });

  it('com execCommand (caminho principal): seleciona o atalho e manda "insertText"', () => {
    const element = textarea('Oi /sig!', 7);
    const calls: Array<{ command: string; value: string; selected: string }> = [];
    mockExecCommand((command, _showUI, value) => {
      calls.push({ command, value, selected: element.value.slice(element.selectionStart, element.selectionEnd) });
      element.setRangeText(value, element.selectionStart, element.selectionEnd, 'end'); // simula o navegador
      return true;
    });

    expect(replaceBeforeCaret({ kind: 'text-control', element }, 4, 'Att, Leo')).toBe('execCommand');
    expect(calls).toEqual([{ command: 'insertText', value: 'Att, Leo', selected: '/sig' }]);
    expect(element.value).toBe('Oi Att, Leo!');
  });

  it('se o execCommand recusar, usa o plano B', () => {
    const element = textarea('Oi /sig');
    mockExecCommand(() => false);
    expect(replaceBeforeCaret({ kind: 'text-control', element }, 4, 'Att, Leo')).toBe('fallback');
    expect(element.value).toBe('Oi Att, Leo');
  });

  it('textarea mantém as quebras de linha', () => {
    const element = textarea('/sig');
    replaceBeforeCaret({ kind: 'text-control', element }, 4, 'Att,\nLeo');
    expect(element.value).toBe('Att,\nLeo');
  });

  it('input de uma linha troca quebras de linha por espaço', () => {
    const element = input('text', 'a /sig');
    replaceBeforeCaret({ kind: 'text-control', element }, 4, 'Linha 1\nLinha 2');
    expect(element.value).toBe('a Linha 1 Linha 2');
  });

  it('input de e-mail (sem API de seleção) também funciona', () => {
    const element = input('email', 'eu/em');
    replaceBeforeCaret({ kind: 'text-control', element }, 3, '@exemplo.com');
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

    await actAndWait(() => replaceBeforeCaret({ kind: 'text-control', element }, 4, 'Att, Leo'));

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
  it('plano B: troca o atalho, quebra linhas com <br> e deixa o cursor no fim', () => {
    const host = editable('Olá /sig');
    caretAtEnd(host);
    const events = recordEvents(host);

    expect(replaceBeforeCaret({ kind: 'contenteditable', element: host }, 4, 'Att,\nLeo')).toBe('fallback');
    expect(host.innerHTML).toBe('Olá Att,<br>Leo');
    expect(textUntilCaret(host)).toBe('Olá Att,Leo');
    expect(events).toEqual(['input:insertText']);
  });

  it('atalho quebrado em formatação ("Olá <b>/s</b>ig")', () => {
    const host = editable('Olá <b>/s</b>ig');
    caretAtEnd(host);
    replaceBeforeCaret({ kind: 'contenteditable', element: host }, 4, 'Att, Leo');
    expect(host.textContent).toBe('Olá Att, Leo');
  });

  it('texto do snippet entra como TEXTO, nunca como HTML', () => {
    const host = editable('/sig');
    caretAtEnd(host);
    replaceBeforeCaret({ kind: 'contenteditable', element: host }, 4, '<img src=x onerror=alert(1)>');
    expect(host.querySelector('img')).toBeNull();
    expect(host.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('com execCommand: seleciona o atalho e manda "insertText"', () => {
    const host = editable('Olá /sig');
    caretAtEnd(host);
    const selected: string[] = [];
    const exec = mockExecCommand(() => {
      selected.push(document.getSelection()?.toString() ?? '');
      return true;
    });
    expect(replaceBeforeCaret({ kind: 'contenteditable', element: host }, 4, 'Att, Leo')).toBe('execCommand');
    expect(exec).toHaveBeenCalledWith('insertText', false, 'Att, Leo');
    expect(selected).toEqual(['/sig']);
  });
});
