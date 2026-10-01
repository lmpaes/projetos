import type { ArgValue, CommandNode } from '../parser';

/** Texto de um argumento cru (ou '' se ausente / se não for cru). */
export function rawText(arg: ArgValue | null | undefined): string {
  return arg?.kind === 'raw' ? arg.text : '';
}

/** Texto de uma setting crua, ou null se ela não foi informada. */
export function rawSetting(node: CommandNode, key: string): string | null {
  return Object.hasOwn(node.settings, key) ? rawText(node.settings[key]) : null;
}
