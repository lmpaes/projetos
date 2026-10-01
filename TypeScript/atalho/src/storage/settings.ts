import { storage } from 'wxt/utils/storage';

/**
 * Modo diagnóstico: quando ligado, o content script escreve no console da
 * página cada passo da expansão (útil para descobrir por que um site não funciona).
 */
export const debugModeItem = storage.defineItem<boolean>('local:debugMode', { fallback: false });
