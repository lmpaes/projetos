// Motor de teste: funções REAIS (extractregex, catch) + comandos FALSOS,
// criados só para exercitar o avaliador antes de existirem os comandos de
// verdade ({site}, {time}, {clipboard} chegam na etapa 4).
import type { RenderContext } from '@/engine/context';
import {
  createEngineRegistry,
  type CommandDefinition,
} from '@/engine/evaluator/definitions';
import { SnippetError } from '@/engine/evaluator/errors';
import { builtinFunctions } from '@/engine/functions';
import { renderTemplate, type RenderResult } from '@/engine/render';

/** Registro de chamadas dos comandos falsos, para testar ordem e "preguiça". */
export const callLog: string[] = [];

const rawText = (node: Parameters<CommandDefinition['run']>[0]): string =>
  node.positional?.kind === 'raw' ? node.positional.text : '';

const fakeCommands: CommandDefinition[] = [
  // {echo: x} → "x"
  {
    name: 'echo',
    positional: { kind: 'raw', required: true },
    embeddable: true,
    run: (node) => {
      callLog.push(`echo:${rawText(node)}`);
      return rawText(node);
    },
  },
  // {list: a,b,c} → ["a", "b", "c"]
  {
    name: 'list',
    positional: { kind: 'raw', required: true },
    embeddable: true,
    run: (node) => rawText(node).split(','),
  },
  // {fail: motivo} → lança SnippetError("motivo")
  {
    name: 'fail',
    positional: { kind: 'raw' },
    embeddable: true,
    run: (node) => {
      callLog.push('fail');
      throw new SnippetError(rawText(node) || 'falhou');
    },
  },
  // {boom} → simula um BUG no comando (erro que não é SnippetError)
  {
    name: 'boom',
    embeddable: true,
    run: () => {
      throw new TypeError('x is not a function');
    },
  },
  // {slow} → comando assíncrono
  {
    name: 'slow',
    embeddable: true,
    run: async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      callLog.push('slow');
      return 'lento';
    },
  },
];

export const testEngine = createEngineRegistry({
  commands: fakeCommands,
  functions: builtinFunctions,
});

/** Contexto falso: página fixa, clipboard fixo, relógio parado. */
export function fakeContext(): RenderContext {
  return {
    page: {
      url: 'https://exemplo.com/pedidos/98765?id=123#detalhes',
      document: document.implementation.createHTMLDocument('Página de teste'),
      selection: () => '',
    },
    clipboard: () => Promise.resolve('texto copiado'),
    now: () => new Date(2026, 9, 1, 14, 30),
  };
}

/** Renderiza com o motor de teste. */
export function render(source: string): Promise<RenderResult> {
  return renderTemplate(source, testEngine, fakeContext());
}

/** Renderiza e devolve só o texto final. */
export async function renderText(source: string): Promise<string> {
  return (await render(source)).text;
}
