// Contexto de teste para o motor REAL (comandos e funções de verdade).
import { createDefaultEngine, renderTemplate, type RenderContext, type RenderResult } from '@/engine';

export const engine = createDefaultEngine();

export interface ContextOptions {
  url?: string;
  title?: string;
  /** HTML do <body> da página de teste. */
  body?: string;
  selection?: string;
  clipboard?: () => Promise<string>;
  now?: Date;
}

/** Monta um RenderContext com uma página falsa (documento separado, criado pelo jsdom). */
export function makeContext(options: ContextOptions = {}): RenderContext {
  const doc = document.implementation.createHTMLDocument(options.title ?? 'Título da aba');
  doc.body.innerHTML = options.body ?? '';
  return {
    page: {
      url: options.url ?? 'https://test.com/my/page?foo=1#part',
      document: doc,
      selection: () => options.selection ?? '',
    },
    clipboard: options.clipboard ?? (() => Promise.resolve('')),
    now: () => options.now ?? new Date(2026, 9, 1, 14, 30, 5),
  };
}

export function renderWith(source: string, options: ContextOptions = {}): Promise<RenderResult> {
  return renderTemplate(source, engine, makeContext(options));
}

export async function textWith(source: string, options: ContextOptions = {}): Promise<string> {
  return (await renderWith(source, options)).text;
}
