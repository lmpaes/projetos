// Especificação: o fluxo completo — digitar o atalho e ver o snippet aparecer.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderTemplate, type RenderResult } from '@/engine';
import { attachExpander, type ExpanderOptions } from '@/content/expander';
import { createMatcher } from '@/content/matcher';
import type { Snippet } from '@/shared/types';
import { engine, makeContext } from '../helpers/context';
import { snippet } from '../storage/fixtures';
import { caretAtEnd, editable, input, resetDom, textarea } from './dom';

let detach: (() => void) | null = null;
afterEach(() => {
  detach?.();
  detach = null;
  resetDom();
});

const sig = snippet({ shortcut: '/sig', content: 'Att, Leo' });

function setup(snippets: Snippet[], overrides: Partial<ExpanderOptions> = {}) {
  const matcher = createMatcher(snippets);
  const onErrors = vi.fn();
  detach = attachExpander(document, {
    getMatcher: () => matcher,
    render: (content) => renderTemplate(content, engine, makeContext()),
    onErrors,
    // O jsdom não gera eventos "confiáveis"; nos testes consideramos todos confiáveis.
    isTrusted: () => true,
    ...overrides,
  });
  return { onErrors };
}

/** Simula o usuário digitando `text` no fim de um input/textarea. */
function typeInto(element: HTMLInputElement | HTMLTextAreaElement, text: string, init: InputEventInit = {}) {
  element.value += text;
  element.setSelectionRange(element.value.length, element.value.length);
  element.dispatchEvent(
    new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: text.slice(-1), ...init }),
  );
}

/** Espera um pouco (para provar que algo NÃO aconteceu). */
const settle = () => new Promise((resolve) => setTimeout(resolve, 30));

describe('expansão', () => {
  it('textarea: "Oi /sig" vira "Oi Att, Leo"', async () => {
    setup([sig]);
    const element = textarea('');
    typeInto(element, 'Oi /sig');
    await vi.waitFor(() => expect(element.value).toBe('Oi Att, Leo'));
  });

  it('executa os comandos do snippet', async () => {
    setup([snippet({ shortcut: '/dom', content: 'Site: {site: domain}' })]);
    const element = textarea('');
    typeInto(element, '/dom');
    await vi.waitFor(() => expect(element.value).toBe('Site: test.com'));
  });

  it('contenteditable', async () => {
    setup([sig]);
    const host = editable('Olá /sig');
    caretAtEnd(host);
    host.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'g' }));
    await vi.waitFor(() => expect(host.textContent).toBe('Olá Att, Leo'));
  });

  it('campo dentro de Shadow DOM aberto (web components)', async () => {
    setup([sig]);
    const host = document.createElement('div');
    document.body.append(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const element = document.createElement('textarea');
    shadow.append(element);
    typeInto(element, '/sig');
    await vi.waitFor(() => expect(element.value).toBe('Att, Leo'));
  });

  it('erros no snippet: insere com [ERRO] e avisa', async () => {
    const broken = snippet({ shortcut: '/x', content: 'Nome: {site: text; selector=.nada}' });
    const { onErrors } = setup([broken]);
    const element = textarea('');
    typeInto(element, '/x');
    await vi.waitFor(() => expect(element.value).toContain('Nome: [ERRO: {site}'));
    expect(onErrors).toHaveBeenCalledWith([expect.objectContaining({ kind: 'runtime' })], broken);
  });

  it('não expande de novo se o texto inserido contém o atalho', async () => {
    setup([snippet({ shortcut: '/sig', content: 'veja /sig' })]);
    const element = textarea('');
    typeInto(element, '/sig');
    await vi.waitFor(() => expect(element.value).toBe('veja /sig'));
    await settle();
    expect(element.value).toBe('veja /sig');
  });
});

describe('quando NÃO expandir', () => {
  it('eventos falsos (disparados por scripts da página) são ignorados', async () => {
    setup([sig], { isTrusted: undefined }); // usa o padrão: event.isTrusted
    const element = textarea('');
    typeInto(element, '/sig');
    await settle();
    expect(element.value).toBe('/sig');
  });

  it('campos de senha', async () => {
    setup([sig]);
    const element = input('password');
    typeInto(element, '/sig');
    await settle();
    expect(element.value).toBe('/sig');
  });

  it('apagar texto não dispara (só digitar)', async () => {
    setup([sig]);
    const element = textarea('');
    typeInto(element, '/sig', { inputType: 'deleteContentBackward', data: null });
    await settle();
    expect(element.value).toBe('/sig');
  });

  it('durante composição (IME / teclas mortas) espera terminar', async () => {
    setup([sig]);
    const element = textarea('');
    typeInto(element, '/sig', { isComposing: true });
    await settle();
    expect(element.value).toBe('/sig');

    element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'g' }));
    await vi.waitFor(() => expect(element.value).toBe('Att, Leo'));
  });

  it('se o usuário continuou digitando antes de o snippet ficar pronto, desiste', async () => {
    let finishRender: (result: RenderResult) => void = () => undefined;
    setup([sig], { render: () => new Promise((resolve) => (finishRender = resolve)) });
    const element = textarea('');
    typeInto(element, '/sig');
    await settle();
    element.value = '/sig e mais'; // o usuário seguiu digitando
    finishRender({ text: 'Att, Leo', errors: [] });
    await settle();
    expect(element.value).toBe('/sig e mais');
  });

  it('depois de desligar (detach), não expande mais', async () => {
    setup([sig]);
    detach?.();
    detach = null;
    const element = textarea('');
    typeInto(element, '/sig');
    await settle();
    expect(element.value).toBe('/sig');
  });
});
