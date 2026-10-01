// Registro dos comandos. Comando novo = um arquivo nesta pasta + uma linha aqui.
import type { CommandDefinition } from '../evaluator/definitions';
import { clipboard } from './clipboard';
import { site } from './site';
import { time } from './time';

export const builtinCommands: readonly CommandDefinition[] = [site, time, clipboard];
