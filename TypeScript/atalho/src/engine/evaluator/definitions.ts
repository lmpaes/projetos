// =============================================================================
// Definições "completas" de comandos e funções: sintaxe + comportamento.
// -----------------------------------------------------------------------------
// Um CommandDefinition É um CommandSyntax (o que o parser precisa) com um
// `run` a mais (o que o avaliador precisa). Assim cada comando fica num
// arquivo só, com tudo o que ele é.
// =============================================================================

import type { RenderContext } from '../context';
import {
  createSyntaxRegistry,
  type CommandNode,
  type CommandSyntax,
  type FunctionSyntax,
  type SyntaxRegistry,
} from '../parser';
import type { Scope } from './scope';
import type { Value } from './values';

/** O que comandos e funções recebem para trabalhar. */
export interface EvalEnv {
  readonly context: RenderContext;
  readonly scope: Scope;
}

export interface CommandDefinition extends CommandSyntax {
  /** Executa o comando e devolve o valor a inserir (pode ser assíncrono). */
  run(node: CommandNode, env: EvalEnv): Value | Promise<Value>;
}

/** Um argumento "preguiçoso": só é calculado quando a função chama thunk(). */
export type Thunk = () => Promise<Value>;

/** Função normal: recebe os argumentos já calculados. */
export interface EagerFunctionDefinition extends FunctionSyntax {
  lazy?: false;
  call(args: Value[], env: EvalEnv): Value | Promise<Value>;
}

/**
 * Função "preguiçosa": recebe os argumentos como thunks e decide se/quando
 * calculá-los. É o caso do catch(), que só calcula o valor padrão se o
 * primeiro argumento falhar.
 */
export interface LazyFunctionDefinition extends FunctionSyntax {
  lazy: true;
  call(args: Thunk[], env: EvalEnv): Value | Promise<Value>;
}

export type FunctionDefinition = EagerFunctionDefinition | LazyFunctionDefinition;

/** Tudo o que o motor conhece: a parte de sintaxe (para o parser) e o comportamento. */
export interface EngineRegistry {
  readonly syntax: SyntaxRegistry;
  readonly commands: ReadonlyMap<string, CommandDefinition>;
  readonly functions: ReadonlyMap<string, FunctionDefinition>;
}

export function createEngineRegistry(input: {
  commands: readonly CommandDefinition[];
  functions: readonly FunctionDefinition[];
}): EngineRegistry {
  return {
    // O parser só "enxerga" a parte de sintaxe de cada definição.
    syntax: createSyntaxRegistry(input),
    commands: new Map(input.commands.map((command) => [command.name, command])),
    functions: new Map(input.functions.map((fn) => [fn.name, fn])),
  };
}
