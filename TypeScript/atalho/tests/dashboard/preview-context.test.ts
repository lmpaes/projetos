// Especificação: a "página de teste" do preview.
import { describe, expect, it } from 'vitest';
import { createDefaultEngine, renderTemplate } from '@/engine';
import { createPreviewContext, DEFAULT_PREVIEW_PAGE, type PreviewPage } from '@/dashboard/preview-context';

const engine = createDefaultEngine();
const page = (overrides: Partial<PreviewPage> = {}): PreviewPage => ({ ...DEFAULT_PREVIEW_PAGE, ...overrides });
const preview = async (source: string, overrides: Partial<PreviewPage> = {}) =>
  (await renderTemplate(source, engine, createPreviewContext(page(overrides), () => new Date(2026, 9, 1)))).text;

describe('createPreviewContext', () => {
  it('a URL de teste alimenta as partes da URL', async () => {
    expect(await preview('{site: domain} {site: query}')).toBe('exemplo.com ?id=123&tab=x');
    expect(await preview('{=extractregex({site: query}, "id=([^&]+)")}')).toBe('123');
  });

  it('título, seleção e clipboard simulados', async () => {
    expect(await preview('{site: title}|{site: selection}|{clipboard}', { title: 'T', selection: 'S', clipboard: 'C' })).toBe(
      'T|S|C',
    );
  });

  it('o HTML de teste permite testar seletores', async () => {
    expect(await preview('{site: text; selector=.cliente .nome}')).toBe('Maria Silva');
    expect(await preview('{site: text; selector=li; multiple=yes}')).toBe('Camiseta, Boné');
  });

  it('o relógio é o informado', async () => {
    expect(await preview('{time: DD/MM/YYYY}')).toBe('01/10/2026');
  });

  it('o título informado vale mesmo se o HTML tiver <title>', async () => {
    expect(await preview('{site: title}', { title: 'Do campo', html: '<title>Do HTML</title><p>x</p>' })).toBe('Do campo');
  });

  it('scripts do HTML de teste NÃO são executados', async () => {
    const flag = globalThis as { __atalhoHacked?: boolean };
    await preview('{site: text}', { html: '<script>globalThis.__atalhoHacked = true</script><p>oi</p>' });
    expect(flag.__atalhoHacked).toBeUndefined();
  });
});
