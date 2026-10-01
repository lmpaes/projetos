// =============================================================================
// Schema de sintaxe: é assim que um comando "se apresenta" ao parser.
// -----------------------------------------------------------------------------
// O parser NÃO tem casos especiais por comando ("se for site, faça X").
// Em vez disso, cada comando declara aqui o formato dos seus argumentos e o
// parser segue essa declaração. Para criar um comando novo (ex.: {if} na Fase
// 2), basta registrar um CommandSyntax novo; o parser continua igual.
// =============================================================================

import type { CommandNode } from './ast';

/**
 * Como ler o valor de um argumento:
 * - 'raw': texto cru até o próximo ";" ou "}". Ex.: seletores CSS e formatos de data.
 * - 'expr': uma expressão de fórmula. Ex. (Fase 2): a condição do {if: ...}.
 */
export type ArgKind = 'raw' | 'expr';

export interface ArgSpec {
  kind: ArgKind;
  /** Só faz sentido no argumento posicional: se true, omitir é erro. */
  required?: boolean;
  /** Só para 'raw': lista de valores aceitos (diferencia maiúsculas de minúsculas). */
  oneOf?: readonly string[];
}

/**
 * Declara um comando de bloco (que "abre" e "fecha"), ex. (Fase 2):
 * { end: 'endif', intermediates: ['elseif', 'else'] } para o {if}.
 */
export interface BlockSpec {
  end: string;
  intermediates?: readonly string[];
}

export interface CommandSyntax {
  /** Nome exato, como digitado depois de "{" (ex.: 'site'). */
  name: string;
  /** Exemplo de uso mostrado nas mensagens de erro (ex.: '{site: url}'). */
  usage?: string;
  /** Argumento depois de ":". Se ausente, o comando não aceita argumento. */
  positional?: ArgSpec;
  /** Configurações chave=valor aceitas depois de ";". */
  settings?: Readonly<Record<string, ArgSpec>>;
  /** Se presente, é um comando de bloco. */
  block?: BlockSpec;
  /** Se true, pode aparecer dentro de uma fórmula: {=catch({site: url}, "")} */
  embeddable?: boolean;
  /**
   * Regra extra que envolve mais de um argumento. Devolve a mensagem de erro,
   * ou null se estiver tudo certo. Ex.: "selector= só vale com text ou html".
   */
  validate?: (node: CommandNode) => string | null;
}

/** Assinatura de uma função de fórmula, ex.: extractregex(texto, regex). */
export interface FunctionSyntax {
  name: string;
  minArgs: number;
  maxArgs: number;
}

/** Tudo o que o parser precisa saber sobre os comandos e funções existentes. */
export interface SyntaxRegistry {
  commands: ReadonlyMap<string, CommandSyntax>;
  functions: ReadonlyMap<string, FunctionSyntax>;
}

/**
 * Monta um SyntaxRegistry a partir de listas. Nome repetido é erro de
 * programação (não do usuário), por isso aqui lançamos exceção mesmo.
 */
export function createSyntaxRegistry(input: {
  commands: readonly CommandSyntax[];
  functions: readonly FunctionSyntax[];
}): SyntaxRegistry {
  const commands = new Map<string, CommandSyntax>();
  for (const command of input.commands) {
    if (commands.has(command.name)) {
      throw new Error(`Comando registrado duas vezes: ${command.name}`);
    }
    commands.set(command.name, command);
  }

  const functions = new Map<string, FunctionSyntax>();
  for (const fn of input.functions) {
    if (functions.has(fn.name)) {
      throw new Error(`Função registrada duas vezes: ${fn.name}`);
    }
    functions.set(fn.name, fn);
  }

  return { commands, functions };
}
