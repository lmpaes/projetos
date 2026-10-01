// Especificação: leitura do clipboard no content script, com fallback via background/offscreen.
import { describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { readClipboard } from '@/content/clipboard';

/** Monta um "navigator" falso só com o que o readClipboard usa. */
const navigatorWith = (readText: () => Promise<string>) =>
  ({ clipboard: { readText } }) as unknown as Pick<Navigator, 'clipboard'>;

/** Faz o "background" responder `response` (o tipo do fakeBrowser não conhece nossas mensagens). */
const backgroundResponds = (response: unknown) =>
  vi.spyOn(fakeBrowser.runtime, 'sendMessage').mockResolvedValue(response as never);

describe('readClipboard', () => {
  it('usa navigator.clipboard quando funciona (sem chamar o background)', async () => {
    const sendMessage = vi.spyOn(fakeBrowser.runtime, 'sendMessage');
    await expect(readClipboard(navigatorWith(() => Promise.resolve('direto')))).resolves.toBe('direto');
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('se a página bloquear, pede ao background (documento offscreen)', async () => {
    const sendMessage = backgroundResponds({ ok: true, text: 'via offscreen' });
    const denied = navigatorWith(() => Promise.reject(new DOMException('negado', 'NotAllowedError')));

    await expect(readClipboard(denied)).resolves.toBe('via offscreen');
    expect(sendMessage).toHaveBeenCalledWith({ target: 'background', type: 'read-clipboard' });
  });

  it('em páginas http (sem navigator.clipboard) também usa o fallback', async () => {
    backgroundResponds({ ok: true, text: 'fallback' });
    const noClipboardApi = {} as Pick<Navigator, 'clipboard'>;
    await expect(readClipboard(noClipboardApi)).resolves.toBe('fallback');
  });

  it('se os dois caminhos falharem, rejeita com o motivo', async () => {
    backgroundResponds({ ok: false, error: 'colar recusado' });
    const denied = navigatorWith(() => Promise.reject(new Error('negado')));
    await expect(readClipboard(denied)).rejects.toThrow('colar recusado');
  });

  it('resposta inválida do background também rejeita', async () => {
    backgroundResponds(undefined);
    const denied = navigatorWith(() => Promise.reject(new Error('negado')));
    await expect(readClipboard(denied)).rejects.toThrow();
  });
});
