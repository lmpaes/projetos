// Registro das funções de fórmula. Função nova = um arquivo nesta pasta + uma linha aqui.
import type { FunctionDefinition } from '../evaluator/definitions';
import { catchFunction } from './catch';
import { extractregex } from './extractregex';

export const builtinFunctions: readonly FunctionDefinition[] = [extractregex, catchFunction];
