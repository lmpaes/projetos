import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import type { CommandDefinition } from '../evaluator/definitions';
import { rawText } from './args';

// Plugin que habilita formatos "por extenso" como LL → "1 de outubro de 2026".
dayjs.extend(localizedFormat);

/**
 * {time: formato}: data/hora atual formatada, em português.
 *
 * Tokens (iguais aos do Text Blaze/moment): DD/MM/YYYY, HH:mm, dddd (dia da
 * semana), MMMM (mês por extenso), LL (data por extenso). Texto literal vai
 * entre colchetes: {time: [Hoje é] dddd}.
 */
export const time: CommandDefinition = {
  name: 'time',
  usage: '{time: DD/MM/YYYY}',
  positional: { kind: 'raw', required: true },
  embeddable: true,
  run(node, { context }) {
    // context.now() em vez de "new Date()": assim os testes usam um relógio parado.
    return dayjs(context.now()).locale('pt-br').format(rawText(node.positional));
  },
};
