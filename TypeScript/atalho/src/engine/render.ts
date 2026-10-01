// =============================================================================
// API pública do motor: texto do snippet → texto final + erros.
// =============================================================================

import type { RenderContext } from './context';
import type { EngineRegistry } from './evaluator/definitions';
import { evaluateNodes, type RenderResult } from './evaluator/evaluate';
import { parseTemplate } from './parser';

export type { RenderError, RenderResult } from './evaluator/evaluate';

/**
 * Renderiza um snippet: faz o parse e executa os comandos/fórmulas.
 * Nunca rejeita a Promise por causa do conteúdo do snippet: problemas viram
 * "[ERRO: ...]" no texto e entradas em `errors`.
 */
export async function renderTemplate(
  source: string,
  registry: EngineRegistry,
  context: RenderContext,
): Promise<RenderResult> {
  const { nodes } = parseTemplate(source, registry.syntax);
  return evaluateNodes(nodes, source, registry, context);
}
