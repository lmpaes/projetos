// =============================================================================
// API pública do motor de snippets. O resto da extensão (content script,
// dashboard) importa só daqui.
// =============================================================================

import { builtinCommands } from './commands';
import { createEngineRegistry, type EngineRegistry } from './evaluator/definitions';
import { builtinFunctions } from './functions';

/** Motor com todos os comandos e funções da Fase 1. */
export function createDefaultEngine(): EngineRegistry {
  return createEngineRegistry({ commands: builtinCommands, functions: builtinFunctions });
}

export { renderTemplate } from './render';
export type { PageProvider, RenderContext } from './context';
export type { EngineRegistry } from './evaluator/definitions';
export type { RenderError, RenderResult } from './evaluator/evaluate';
