import type { Node, ParseError } from '../parser';
import type { RenderContext } from '../context';
import type { EngineRegistry } from './definitions';

/** Um erro mostrado ao usuário (no texto inserido, no toast e no dashboard). */
export interface RenderError {
  /** 'syntax' = snippet mal escrito; 'runtime' = falhou ao executar. */
  kind: 'syntax' | 'runtime';
  message: string;
  span: ParseError['span'];
  line: number;
  column: number;
}

export interface RenderResult {
  /** Texto final, com "[ERRO: ...]" no lugar dos trechos que falharam. */
  text: string;
  /** Todos os erros, na ordem em que aparecem no snippet. */
  errors: RenderError[];
}

/**
 * Executa os nós da AST, em ordem, e monta o texto final.
 * ETAPA 3 (TDD): ainda não implementado.
 */
export function evaluateNodes(
  nodes: readonly Node[],
  source: string,
  registry: EngineRegistry,
  context: RenderContext,
): Promise<RenderResult> {
  void nodes;
  void source;
  void registry;
  void context;
  return Promise.reject(new Error('evaluateNodes: não implementado (etapa 3)'));
}
