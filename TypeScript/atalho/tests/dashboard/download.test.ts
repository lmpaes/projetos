// Especificação: baixar um arquivo de texto sem precisar da permissão "downloads".
import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadText } from '@/dashboard/download';

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('downloadText', () => {
  it('cria um link temporário com o arquivo, clica e limpa', async () => {
    vi.useFakeTimers();
    const urlApi = { createObjectURL: vi.fn<(blob: Blob) => string>(() => 'blob:fake'), revokeObjectURL: vi.fn() };
    const clicked: Array<{ href: string; download: string }> = [];
    document.addEventListener(
      'click',
      (event) => {
        const anchor = event.target as HTMLAnchorElement;
        clicked.push({ href: anchor.getAttribute('href') ?? '', download: anchor.download });
        event.preventDefault(); // o jsdom não navega
      },
      { once: true },
    );

    downloadText(document, 'backup.json', '{"a":1}', urlApi);

    expect(clicked).toEqual([{ href: 'blob:fake', download: 'backup.json' }]);
    expect(document.querySelector('a')).toBeNull();
    const blob = urlApi.createObjectURL.mock.calls[0]?.[0] as Blob;
    expect(await blob.text()).toBe('{"a":1}');
    vi.runAllTimers();
    expect(urlApi.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
  });
});
